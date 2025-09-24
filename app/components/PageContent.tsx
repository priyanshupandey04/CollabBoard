// app/components/PageContent.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Rectangle from "./Shapes/Rectangle";
import Ellipse from "./Shapes/Ellipse";
import { Line } from "./Shapes/Line";
import Path from "./Shapes/Path";
import SideBar from "./SideBar";
import Text from "./Shapes/Text";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { useUndo, useRedo, useHistory } from "@liveblocks/react";
import SideBarText from "./SideBarText";
import Button from "./Button";
import CanvasToolbarControls from "./CanvasToolbarControls";

type Shape =
  | { type: "rectangle"; x: number; y: number; deleted?: boolean }
  | { type: "ellipse"; x: number; y: number; deleted?: boolean }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      deleted?: boolean;
    }
  | {
      type: "path";
      points: number[][];
      strokeColor?: string;
      fillColor?: string;
      deleted?: boolean;
    }
  | { type: "text"; x: number; y: number; content: string; deleted?: boolean };

interface PageContentProps {
  /** optional, provided by the route page (no internal behaviour depends on this prop) */
  roomId?: string;
}

const PageContent: React.FC<PageContentProps> = (_props) => {
  const [armedShape, setArmedShape] = useState<
    "rectangle" | "ellipse" | "line" | "path" | "text" | null
  >(null);

  // Liveblocks storage (suspense hook used in this file)
  const shapes = useStorage((root: any) =>
    root ? (root as any).shapes : null
  ) as any;

  // Undo / Redo / History
  const undo = useUndo();
  const redo = useRedo();
  const { pause, resume } = useHistory();
  const [showEdit, setShowEdit] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const suppressBlurRef = useRef<boolean | null>(false);

  // Add shape mutation
  const addShape = useMutation(({ storage }: any, shape: Shape) => {
    const list = (storage as any).get("shapes") as any;
    if (!list) return;
    list.push(shape);
  }, []);

  // SOFT-DELETE mutation (single shape flag)
  const softDeleteShapeMutation = useMutation(
    ({ storage }: any, idx: number) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(idx);
      if (!existing) return;
      list.set(idx, { ...existing, deleted: true });
    },
    []
  );

  // helper wrapper so we can call pause/resume around the mutation
  const softDeleteShape = async (idx: number) => {
    try {
      pause();
    } catch {}
    try {
      await softDeleteShapeMutation(idx);
    } finally {
      try {
        resume();
      } catch {}
    }
  };

  // viewport / viewBox
  const [viewport, setViewport] = useState({ width: 2000, height: 2000 });
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 2000,
    height: 2000,
  });

  // selection / modes
  const [draggableId, setDraggableId] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  // When creating a new path we will ask Path to start drawing immediately.
  const [startDrawingId, setStartDrawingId] = useState<number | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setViewBox((vb) => ({
        ...vb,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const getSVGCoords = (
    e: MouseEvent | React.MouseEvent,
    svg: SVGSVGElement
  ) => {
    const pt = svg.createSVGPoint();
    pt.x = "clientX" in e ? e.clientX : 0;
    pt.y = "clientY" in e ? e.clientY : 0;
    return pt.matrixTransform(svg.getScreenCTM()?.inverse());
  };

  const startClientRef = useRef<{ x: number; y: number } | null>(null);
  const startViewBoxRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // When erase mode is on and a draggableId is set => soft-delete that single shape
  useEffect(() => {
    if (isErasing && draggableId !== null) {
      // call wrapper that pauses/resumes history so this single mutation is one undo step
      const softDelete = async () => {
        try {
          await softDeleteShape(draggableId);
        } catch (err) {
          console.warn("soft delete failed:", err);
        } finally {
          // keep erasing ON, but clear the selection so next click will pick another shape
          setDraggableId(null);
        }
      };

      softDelete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggableId, isErasing]);

  useEffect(() => {
    if (!isDragging) return;
    const mousemove = (e: MouseEvent) => {
      const startClient = startClientRef.current;
      const startViewBox = startViewBoxRef.current;
      if (!startClient || !startViewBox) return;
      const dxClient = e.clientX - startClient.x;
      const dyClient = e.clientY - startClient.y;
      const scaleX = startViewBox.width / viewport.width;
      const scaleY = startViewBox.height / viewport.height;
      const newX = startViewBox.x - dxClient * scaleX;
      const newY = startViewBox.y - dyClient * scaleY;
      setViewBox((prev) => ({ ...prev, x: newX, y: newY }));
    };
    const mouseup = () => {
      setIsDragging(false);
      startClientRef.current = null;
      startViewBoxRef.current = null;
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };
  }, [isDragging, viewport]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      setViewBox((vb) => ({ ...vb, x: vb.x + e.deltaX, y: vb.y + e.deltaY }));
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isPanning]);

  // wrappers for undo/redo
  const safeUndo = async () => {
    if (isTextEditing) return;
    try {
      await undo();
    } catch (err) {
      console.warn("Undo failed:", err);
    }
  };

  const safeRedo = async () => {
    if (isTextEditing) return;
    try {
      await redo();
    } catch (err) {
      console.warn("Redo failed:", err);
    }
  };

  // NEW: keyboard shortcuts for undo / redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ignore if a text-editing flag is set
      if (isTextEditing) return;

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();

      // Ctrl/Cmd + Z => undo (unless Shift present — handled below for redo)
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        safeUndo();
        return;
      }

      // Ctrl/Cmd + Y => redo
      if (key === "y") {
        e.preventDefault();
        safeRedo();
        return;
      }

      // Ctrl/Cmd + Shift + Z => redo (common on Mac)
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        safeRedo();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [safeUndo, safeRedo, isTextEditing]);

  return (
    <div className="w-screen h-screen overflow-hidden select-none m-0 p-0">
      <div className="flex gap-2 mt">
        <div className="flex gap-2 mt-2 w-full absolute fixed">
          {/* toolbar (kept the same) */}
          <Button
            isTextEditing={isTextEditing}
            setArmedShape={setArmedShape}
            shape="text"
            isErasing={isErasing}
          >
            Text
          </Button>

          <Button
            isTextEditing={isTextEditing}
            setArmedShape={setArmedShape}
            shape="path"
            isErasing={isErasing}
          >
            Path
          </Button>

          <Button
            isTextEditing={isTextEditing}
            setArmedShape={setArmedShape}
            shape="rectangle"
            isErasing={isErasing}
          >
            Rectangle
          </Button>

          <Button
            isTextEditing={isTextEditing}
            setArmedShape={setArmedShape}
            shape="ellipse"
            isErasing={isErasing}
          >
            Ellipse
          </Button>

          <Button
            isTextEditing={isTextEditing}
            setArmedShape={setArmedShape}
            shape="line"
            isErasing={isErasing}
          >
            Line
          </Button>
          <CanvasToolbarControls
            isErasing={isErasing}
            setIsErasing={setIsErasing}
            isPanning={isPanning}
            setIsPanning={setIsPanning}
            isTextEditing={isTextEditing}
            setIsTextEditing={setIsTextEditing}
            setDraggableId={setDraggableId}
            setArmedShape={setArmedShape}
            setShowEdit={setShowEdit}
            setViewBox={setViewBox}
            safeUndo={safeUndo}
            safeRedo={safeRedo}
          />
        </div>

        <svg
          width={viewport.width}
          height={viewport.height}
          style={{ background: "#131313FF" }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className={` ${isDragging ? "cursor-grabbing" : ""} ${
            isPanning ? "cursor-grab" : ""
          }`}
          onMouseDown={(e) => {
            if (!isPanning) return;
            startClientRef.current = { x: e.clientX, y: e.clientY };
            startViewBoxRef.current = { ...viewBox };
            setIsDragging(true);
          }}
          onClick={(e) => {
            if (armedShape) {
              const svg = e.currentTarget as SVGSVGElement;
              const { x, y } = getSVGCoords(e, svg);

              if (armedShape === "rectangle" || armedShape === "ellipse") {
                addShape({ type: armedShape, x, y } as any);
              } else if (armedShape === "line") {
                addShape({
                  type: "line",
                  x1: x,
                  y1: y,
                  x2: x + 100,
                  y2: y,
                });
              } else if (armedShape === "path") {
                try {
                  pause();
                } catch {}
                const idx = shapes ? shapes.length : 0;
                addShape({ type: "path", points: [] } as any);
                setStartDrawingId(idx);
                setDraggableId(idx);
              } else if (armedShape === "text") {
                addShape({ type: "text", x, y, content: "Edit me!" } as any);
              }
              setArmedShape(null);
            }
          }}
        >
          {(shapes || []).map((s: Shape, i: number) => {
            if (!s || (s as any).deleted) return null;

            if (s.type === "rectangle") {
              return (
                <Rectangle
                  key={i}
                  id={i}
                  x={(s as any).x}
                  y={(s as any).y}
                  draggableId={draggableId}
                  setDraggableId={setDraggableId}
                  isPanning={isPanning}
                  viewBox={viewBox}
                  isTextEditing={isTextEditing}
                />
              );
            } else if (s.type === "ellipse") {
              return (
                <Ellipse
                  key={i}
                  id={i}
                  cx={(s as any).x}
                  cy={(s as any).y}
                  draggableId={draggableId}
                  setDraggableId={setDraggableId}
                  isPanning={isPanning}
                  viewBox={viewBox}
                  isTextEditing={isTextEditing}
                />
              );
            } else if (s.type === "line") {
              return (
                <Line
                  key={i}
                  id={i}
                  x1={(s as any).x1}
                  y1={(s as any).y1}
                  x2={(s as any).x2}
                  y2={(s as any).y2}
                  draggableId={draggableId}
                  setDraggableId={setDraggableId}
                  isPanning={isPanning}
                  isTextEditing={isTextEditing}
                />
              );
            } else if (s.type === "path") {
              return (
                <Path
                  key={i}
                  id={i}
                  draggableId={draggableId}
                  setDraggableId={setDraggableId}
                  viewBox={viewBox}
                  isPanning={isPanning}
                  startDrawingId={startDrawingId}
                  setStartDrawingId={setStartDrawingId}
                  isTextEditing={isTextEditing}
                />
              );
            } else if (s.type === "text") {
              return (
                <Text
                  key={i}
                  id={i}
                  x={(s as any).x}
                  y={(s as any).y}
                  draggableId={draggableId}
                  setDraggableId={setDraggableId}
                  isPanning={isPanning}
                  viewBox={viewBox}
                  content={(s as any).content}
                  showEdit={showEdit}
                  setShowEdit={setShowEdit}
                  isTextEditing={isTextEditing}
                  setIsTextEditing={setIsTextEditing}
                  suppressBlurRef={suppressBlurRef}
                />
              );
            }
            return null;
          })}
        </svg>

        {/* sidebars */}
        {typeof draggableId === "number" &&
        shapes &&
        shapes[draggableId] &&
        (shapes[draggableId].type === "path" ||
          shapes[draggableId].type === "rectangle" ||
          shapes[draggableId].type === "ellipse" ||
          shapes[draggableId].type === "line") ? (
          <SideBar id={draggableId} onClose={() => setDraggableId(null)} />
        ) : null}

        {showEdit && typeof draggableId === "number" && (
          <SideBarText
            id={draggableId}
            onClose={() => {
              setShowEdit(false);
              setDraggableId(null);
              setIsTextEditing(false);
            }}
            suppressBlurRef={suppressBlurRef}
          />
        )}
      </div>
    </div>
  );
};

export default PageContent;
