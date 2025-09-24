// app/components/Shapes/Ellipse.tsx
"use client";
import { getMousePosition } from "@/app/utils/utils";
import React, { useState, useEffect, useRef } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import { useHistory } from "@liveblocks/react/suspense";
type Props = {
  id: number;
  cx: number;
  cy: number;
  draggableId: number | null;
  setDraggableId: React.Dispatch<React.SetStateAction<number | null>>;
  isPanning: boolean;
  onSelect?: (id: number) => void; // <-- new optional callback prop
  viewBox: { x: number; y: number; width: number; height: number };
  isTextEditing: boolean;
};

export default function Ellipse({
  id,
  cx,
  cy,
  draggableId,
  isPanning,
  setDraggableId,
  onSelect,
  viewBox,
  isTextEditing,
}: Props) {
  // --- Local state (unchanged core logic) ---
  const [coords, setCoords] = useState({ cx, cy, rx: 50, ry: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizableOption, setResizableOption] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
    const { pause, resume } = useHistory();


  const ellipseRef = useRef<SVGEllipseElement | null>(null);
  const handlesRef = useRef<SVGGElement | null>(null);

  // --- Liveblocks: subscribe to shapes list (typed as any to avoid TS 'never' issues) ---
  const shapes = useStorage((root: any) => (root ? (root as any).shapes : null)) as any;

  // --- Mutation: replace item at index `id` with merged object ---
  const replaceShapeAtIndex = useMutation(
    ({ storage }: any, patch: Partial<{ cx: number; cy: number; rx: number; ry: number; strokeColor?: string; fillColor?: string; strokeWidth?: number }>) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id);
      if (!existing) return;
      list.set(id, { ...existing, ...patch });
    },
    [id]
  );

  // When shared shape changes remotely, update local coords (avoid feedback loops)
  useEffect(() => {
    if(isTextEditing) return;
    try {
      const shared = shapes ? shapes[id] : undefined;
      if (shared && typeof shared === "object") {
        const ncx = shared.cx ?? coords.cx;
        const ncy = shared.cy ?? coords.cy;
        const nrx = shared.rx ?? coords.rx;
        const nry = shared.ry ?? coords.ry;

        if (ncx !== coords.cx || ncy !== coords.cy || nrx !== coords.rx || nry !== coords.ry) {
          setCoords({ cx: ncx, cy: ncy, rx: nrx, ry: nry });
        }
      }
    } catch (err) {
      // shapes may be undefined while room initializes — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, id]);

  // ---- Dragging logic (keeps your math) ----
  const handleMouseDown = (e: React.MouseEvent<SVGEllipseElement, MouseEvent>) => {
    if (isPanning || isTextEditing) return;
    setDraggableId(id);
    const { x: mouseX, y: mouseY } = getMousePosition(e as React.MouseEvent);

    setOffset({ x: mouseX - coords.cx, y: mouseY - coords.cy });

    setShowHandles(true);
    setIsDragging(true);
    pause();
    // notify parent that this ellipse was selected (parent can open sidebar)
    if (onSelect) onSelect(id);
  };

  useEffect(() => {
    if (isPanning || isTextEditing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x: mouseX, y: mouseY } = getMousePosition(e as MouseEvent);

      const bottomRight = {
        x: coords.cx + coords.rx,
        y: coords.cy + coords.ry,
      };
      const topRight = { x: coords.cx + coords.rx, y: coords.cy - coords.ry };
      const bottomLeft = { x: coords.cx - coords.rx, y: coords.cy + coords.ry };
      const topLeft = { x: coords.cx - coords.rx, y: coords.cy - coords.ry };

      // Dragging
      if (isDragging && draggableId === id) {
        const next = { ...coords, cx: mouseX - offset.x, cy: mouseY - offset.y };
        setCoords(next);
        // push to live storage
        replaceShapeAtIndex({ cx: next.cx, cy: next.cy });
      }

      // Resizing
      if (isResizing) {
        let next: { cx: number; cy: number; rx: number; ry: number } | null = null;
        switch (resizableOption) {
          case "top-left":
            next = {
              rx: (mouseX + bottomRight.x) / 2 - mouseX,
              ry: (mouseY + bottomRight.y) / 2 - mouseY,
              cx: (mouseX + bottomRight.x) / 2,
              cy: (mouseY + bottomRight.y) / 2,
            };
            break;
          case "top-right":
            next = {
              rx: mouseX - (mouseX + bottomLeft.x) / 2,
              ry: (mouseY + bottomLeft.y) / 2 - mouseY,
              cx: (mouseX + bottomLeft.x) / 2,
              cy: (mouseY + bottomLeft.y) / 2,
            };
            break;
          case "bottom-left":
            next = {
              rx: (mouseX + topRight.x) / 2 - mouseX,
              ry: mouseY - (mouseY + topRight.y) / 2,
              cx: (mouseX + topRight.x) / 2,
              cy: (mouseY + topRight.y) / 2,
            };
            break;
          case "bottom-right":
            next = {
              rx: mouseX - (mouseX + topLeft.x) / 2,
              ry: mouseY - (mouseY + topLeft.y) / 2,
              cx: (mouseX + topLeft.x) / 2,
              cy: (mouseY + topLeft.y) / 2,
            };
            break;
        }
        if (next) {
          // merge with current coords so rx/ry exist
          const merged = { ...coords, ...next };
          setCoords(merged);
          replaceShapeAtIndex({ cx: merged.cx, cy: merged.cy, rx: merged.rx, ry: merged.ry });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizableOption(null);
      setDraggableId(null);
      resume();
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // Note: coords intentionally omitted from deps to keep same behavior as original code,
    // shared changes are handled by the shapes subscription above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDragging,
    isResizing,
    draggableId,
    id,
    offset,
    resizableOption,
    setDraggableId,
    isPanning,
  ]);

  // ---- Close handles on outside click ----
  useEffect(() => {
    if (isPanning || isTextEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ellipseRef.current &&
        !ellipseRef.current.contains(e.target as Node) &&
        handlesRef.current &&
        !handlesRef.current.contains(e.target as Node)
      ) {
        setShowHandles(false);
      }
    };

    if (showHandles) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHandles, isPanning]);

  // read style from shared storage if present (keeps behaviour consistent with other shapes)
  const shared = shapes ? shapes[id] : undefined;
  const strokeColor = shared?.strokeColor ?? (draggableId === id ? "blue" : "red");
  const fillColor = shared?.fillColor ?? "lightgreen";
  const strokeWidth = shared?.strokeWidth ?? 3;
  // console.log("Ellipse");
  return (
    <>
      {/* Main Ellipse */}
      <ellipse
        ref={ellipseRef}
        cx={coords.cx}
        cy={coords.cy}
        rx={coords.rx}
        ry={coords.ry}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fillColor}
        onMouseDown={handleMouseDown}
        style={{ cursor: draggableId === id ? "move" : "default" }}
        onClick={() => {
          // ensure draggableId is set on click as before and also notify parent
          setDraggableId(id);
          if (onSelect) onSelect(id);
        }}
      />

      {/* Resize Handles */}
      {showHandles && (
        <g ref={handlesRef} className="bg-amber-50 z-50">
          {/* Top-left */}
          <rect
            x={`${(coords.cx - coords.rx - 5) -10*viewBox.width/2000 }`}
            y={coords.cy - coords.ry - 5 - 10*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              pause();
              setResizableOption("top-left");
            }}
          />
          {/* Top-right */}
          <rect
            x={coords.cx + coords.rx - 5 - 10*viewBox.width/2000}
            y={coords.cy - coords.ry - 5 - 10*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nesw-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              pause();
              setResizableOption("top-right");
            }}
          />
          {/* Bottom-left */}
          <rect
            x={coords.cx - coords.rx - 5 - 10*viewBox.width/2000}
            y={coords.cy + coords.ry - 5 - 10*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nesw-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              pause();
              setResizableOption("bottom-left");
            }}
          />
          {/* Bottom-right */}
          <rect
            x={coords.cx + coords.rx - 5 - 10*viewBox.width/2000}
            y={coords.cy + coords.ry - 5 - 10*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              pause();
              setResizableOption("bottom-right");
            }}
          />
        </g>
      )}
    </>
  );
}
