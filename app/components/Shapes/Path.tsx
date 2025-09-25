// app/components/Shapes/Path.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { getMousePosition, getSvgPathFromStroke } from "@/app/utils/utils";
import getStroke from "perfect-freehand";
import { useStorage, useMutation, useHistory } from "@liveblocks/react";

type Props = {
  id: number;
  draggableId: number | null;
  setDraggableId: React.Dispatch<React.SetStateAction<number | null>>;
  viewBox: { x: number; y: number; width: number; height: number };
  isPanning: boolean;
  // new props to support "create + immediate draw" grouping
  startDrawingId?: number | null;
  setStartDrawingId?: (id: number | null) => void;
    isTextEditing: boolean;

};

export default function Path({
  id,
  draggableId,
  setDraggableId,
  viewBox,
  isPanning,
  startDrawingId,
  setStartDrawingId,
  isTextEditing,
}: Props) {
  const [points, setPoints] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  // liveblocks shapes
  const shapes = useStorage((root: any) => (root ? (root as any).shapes : null)) as any;

  // history helpers
  const { resume, pause } = useHistory();
  console.log("path is being called");
  // mutation (writes a points array or a patch)
  const replaceShapeAtIndex = useMutation(
    ({ storage }: any, patchOrPoints: number[][] | { points?: number[][]; strokeColor?: string; fillColor?: string }) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id);
      if (!existing) return;

      if (Array.isArray(patchOrPoints)) {
        list.set(id, { ...existing, points: patchOrPoints });
      } else {
        list.set(id, { ...existing, ...patchOrPoints });
      }
    },
    [id]
  );

  // convert mouse to svg coords
 

  const getPathFromPoints = (pts: number[][]) => {
    const stroke = getStroke(pts, {
      size: 8,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });
    return getSvgPathFromStroke(stroke);
  };

  // ---- helpers & refs for throttling / comparing ----
  const pointsRef = useRef<number[][]>(points); // always keep latest points
  const pushScheduledRef = useRef<number | null>(null); // timeout id for throttle
  const pushInProgressRef = useRef(false); // avoid overlapping pushes

  // throttle interval (ms)
  const THROTTLE_MS = 100;

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // efficient deep-equal for points
  const equalPoints = (a?: number[][], b?: number[][]) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const aa = a[i];
      const bb = b[i];
      if (!aa || !bb || aa.length !== bb.length) return false;
      for (let j = 0; j < aa.length; j++) {
        if (aa[j] !== bb[j]) return false;
      }
    }
    return true;
  };

  // schedule a push to Liveblocks (throttled) — pushes full points array (NO compression)
  const schedulePush = () => {
    if (pushScheduledRef.current != null) return;
    pushScheduledRef.current = window.setTimeout(async () => {
      pushScheduledRef.current = null;
      if (pushInProgressRef.current) return;
      const toPush = pointsRef.current;
      try {
        pushInProgressRef.current = true;
        // ensure we await the mutation so we don't overlap pushes
        await Promise.resolve(replaceShapeAtIndex(toPush));
      } catch {
        // ignore
      } finally {
        pushInProgressRef.current = false;
      }
    }, THROTTLE_MS);
  };

  // immediate flush (used on mouseup to ensure final points are written) — pushes full points array
  const flushPush = async () => {
    if (pushScheduledRef.current != null) {
      clearTimeout(pushScheduledRef.current);
      pushScheduledRef.current = null;
    }
    const toPush = pointsRef.current;
    try {
      await Promise.resolve(replaceShapeAtIndex(toPush));
    } catch {
      // ignore
    }
  };

  // Remote -> Local sync: only update local when remote is different
  useEffect(() => {
    if(isTextEditing) return;
    try {
      const shared = shapes ? shapes[id] : undefined;
      if (shared && Array.isArray(shared.points)) {
        const remotePoints = shared.points as number[][];
        if (!equalPoints(remotePoints, pointsRef.current)) {
          setPoints(remotePoints);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, id]);

  // Document-level drawing (local state only) — throttle pushes
  useEffect(() => {
    if (isPanning || isTextEditing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y } = getMousePosition(e);

      if (isDrawing) {
        setPoints((prev) => {
          const next = [...prev, [x, y]];
          schedulePush();
          return next;
        });
      } else if (isDragging && lastMouseRef.current) {
        const dx = x - lastMouseRef.current.x;
        const dy = y - lastMouseRef.current.y;
        setPoints((prev) => {
          const next = prev.map(([px, py]) => [px + dx, py + dy]);
          return next;
        });
        lastMouseRef.current = { x, y };
        schedulePush();
      }
    };

    const handleMouseUp = async () => {
      if (isDrawing) {
        setIsDrawing(false);
        setDraggableId(null);
        await flushPush();
        try {
          await resume();
        } catch {
          /* ignore if resume fails */
        }
        if (typeof setStartDrawingId === "function") {
          setStartDrawingId(null);
        }
      }
      if (isDragging) {
        setIsDragging(false);
        lastMouseRef.current = null;
        await flushPush();
        try {
          await resume();
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (pushScheduledRef.current != null) {
        clearTimeout(pushScheduledRef.current);
        pushScheduledRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing, isDragging, setDraggableId, isPanning]);

  // If PageContent requested immediate drawing for this new shape,
  // start drawing mode (PageContent called pause() before creating the shape).
  useEffect(() => {
    if(isTextEditing) return;
    if (startDrawingId === id && points.length === 0) {
      setIsDrawing(true);
      setDraggableId(id);
      // leave clearing of startDrawingId to the component when drawing ends
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDrawingId, id]);

  // Start drawing on first mousedown (for cases where the path existed but empty)
  useEffect(() => {
    if (isPanning || isTextEditing) return;

    const handleMouseDown = (e: MouseEvent) => {
      const { x, y } = getMousePosition(e);

      if (points.length === 0 && !isDrawing) {
        const initial = [[x, y]];
        setPoints(initial);
        schedulePush();
        setIsDrawing(true);
        setDraggableId(id);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [points.length, id, setDraggableId, isPanning]);

  // Render path
  const pathD = useMemo(() => (points.length ? getPathFromPoints(points) : ""), [points]);

  const shared = shapes ? shapes[id] : undefined;
  const strokeColor = shared?.strokeColor ?? (isDrawing ? "blue" : "red");
  const fillColor = shared?.fillColor ?? "none";
  const strokeWidth = shared?.strokeWidth ?? 3;

  return pathD ? (
    <path
      d={pathD}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill={fillColor}
      className="hover:cursor-move"
      onMouseDown={(e) => {
        if(isTextEditing) return;
        if (!isDrawing) {
          setDraggableId(id);
          setIsDragging(true);
          try {
            // pause history for drag (group drag updates) — may throw; ignore
            pause();
          } catch {
            /* ignore */
          }
          const { x, y } = getMousePosition(e.nativeEvent);
          lastMouseRef.current = { x, y };
        }
      }}
    />
  ) : null;
}
