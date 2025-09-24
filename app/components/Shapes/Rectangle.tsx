// app/components/Shapes/Rectangle.tsx
"use client";
import { getMousePosition } from "@/app/utils/utils";
import React, { useState, useEffect, useRef } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import { useHistory } from "@liveblocks/react";

type Props = {
  id: number;
  x: number;
  y: number;
  draggableId: number | null;
  setDraggableId: React.Dispatch<React.SetStateAction<number | null>>;
  isPanning: boolean;
  viewBox: { x: number; y: number; width: number; height: number };
  isTextEditing: boolean;
};

export default function Rectangle({
  id,
  x,
  y,
  draggableId,
  setDraggableId,
  isPanning,
  viewBox,
  isTextEditing,
}: Props) {
  const [coords, setCoords] = useState({ x, y, width: 20, height: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizableOption, setResizableOption] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // NEW: sidebar toggle
  const rectangle = useRef<SVGRectElement | null>(null);
  const handlesRef = useRef<SVGGElement | null>(null);
  const {pause, resume} = useHistory();

  const shapes = useStorage((root: any) =>
    root ? (root as any).shapes : null
  ) as any;

  const replaceShapeAtIndex = useMutation(
    (
      { storage }: any,
      patch: Partial<{
        x: number;
        y: number;
        width: number;
        height: number;
        strokeColor?: string;
        fillColor?: string;
        rx?: number;
        strokeWidth?: number;
      }>
    ) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id);
      if (!existing) return;
      list.set(id, { ...existing, ...patch });
    },
    [id]
  );

  // sync local coords when remote updates
  useEffect(() => {
    if(isTextEditing) return;
    try {
      const shared = shapes ? shapes[id] : undefined;
      if (shared && typeof shared === "object") {
        const nx = shared.x ?? coords.x;
        const ny = shared.y ?? coords.y;
        const nw = shared.width ?? coords.width;
        const nh = shared.height ?? coords.height;
        if (
          nx !== coords.x ||
          ny !== coords.y ||
          nw !== coords.width ||
          nh !== coords.height
        ) {
          setCoords({ x: nx, y: ny, width: nw, height: nh });
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, id]);

  // dragging
  const handleMouseDown = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {

    if (isPanning || isTextEditing) return;
    setDraggableId(id);
    const { x: mouseX, y: mouseY } = getMousePosition(e as React.MouseEvent);
    setOffset({ x: mouseX - coords.x, y: mouseY - coords.y });

    setShowHandles(true);
    setShowSidebar(true); // show sidebar when clicked
    setIsDragging(true);

    pause();
  };

  // global drag/resize
  useEffect(() => {
    if (isPanning || isTextEditing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x: mouseX, y: mouseY } = getMousePosition(e as MouseEvent);

      if (isDragging && draggableId === id) {
        const next = { ...coords, x: mouseX - offset.x, y: mouseY - offset.y };
        setCoords(next);
        replaceShapeAtIndex({ x: next.x, y: next.y });
      }

      if (isResizing) {
        if (resizableOption === "bottom-right") {
          if (mouseX - coords.x < 0 || mouseY - coords.y < 0) return;
          const next = {
            ...coords,
            width: mouseX - coords.x,
            height: mouseY - coords.y,
          };
          setCoords(next);
          replaceShapeAtIndex({ width: next.width, height: next.height });
        }
        if (resizableOption === "top-right") {
          if (mouseX - coords.x < 0) return;
          const next = {
            ...coords,
            width: mouseX - coords.x,
            height: coords.height + (coords.y - mouseY),
            y: mouseY,
          };
          setCoords(next);
          replaceShapeAtIndex({
            width: next.width,
            height: next.height,
            y: next.y,
          });
        }
        if (resizableOption === "bottom-left") {
          if (mouseY - coords.y < 0) return;
          const next = {
            ...coords,
            width: coords.width + (coords.x - mouseX),
            height: mouseY - coords.y,
            x: mouseX,
          };
          setCoords(next);
          replaceShapeAtIndex({
            width: next.width,
            height: next.height,
            x: next.x,
          });
        }
        if (resizableOption === "top-left") {
          // if (mouseY - coords.y < 0) return;
          const next = {
            ...coords,
            width: coords.width + (coords.x - mouseX),
            height: coords.height + (coords.y - mouseY),
            x: mouseX,
            y: mouseY,
          };
          setCoords(next);
          replaceShapeAtIndex({
            width: next.width,
            height: next.height,
            x: next.x,
            y: next.y,
          });
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
  }, [
    isDragging,
    isResizing,
    draggableId,
    id,
    offset,
    resizableOption,
    coords,
    isPanning,
  ]);

  // hide handles when clicking outside
  useEffect(() => {
    if (isPanning || isTextEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        handlesRef.current &&
        !handlesRef.current.contains(e.target as Node) &&
        rectangle.current &&
        !rectangle.current.contains(e.target as Node)
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

  // style values
  const shared = shapes ? shapes[id] : undefined;
  const strokeColor =
    shared?.strokeColor ?? (draggableId === id ? "blue" : "red");
  const fillColor = shared?.fillColor ?? "yellow";
  const strokeWidth = shared?.strokeWidth ?? 3;
  const radius = shared?.rx ?? 20;
  // console.log("Rectangle");
  return (
    <>
      {/* Main Rectangle */}
      <rect
        x={coords.x}
        y={coords.y}
        ref={rectangle}
        width={coords.width}
        height={coords.height}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fillColor}
        rx={radius}
        ry={radius}
        onMouseDown={handleMouseDown}
        style={{ cursor: draggableId === id ? "move" : "default" }}
        onClick={() => setDraggableId(id)}
      />

      {/* Resize Handles */}
      {showHandles && (
        <g ref={handlesRef}>
          <rect
            x = {`${(coords.x + coords.width - 5) -5*viewBox.width/2000 }`}
            y = {`${(coords.y + coords.height - 5) -5*viewBox.width/2000 }`}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              setResizableOption("bottom-right");
              pause();
            }}
          />
          <rect
            x={coords.x + coords.width - 5 - 5*viewBox.width/2000}
            y={coords.y - 5 - 5*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nesw-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              setResizableOption("top-right");
              pause();

            }}
          />
          <rect
            x={coords.x - 5 - 5*viewBox.width/2000}
            y={coords.y + coords.height - 5 - 5*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nesw-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              setResizableOption("bottom-left");
              pause();
            }}
          />
          <rect
            x={coords.x - 5 - 5*viewBox.width/2000}
            y={coords.y - 5 - 5*viewBox.width/2000}
            width={`${20*viewBox.width/2000}px`}
            height={`${20*viewBox.width/2000}px`}
            stroke="#6DCDEC"
            strokeWidth="5"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={() => {
              setIsResizing(true);
              setResizableOption("top-left");
              pause();

            }}
          />
        </g>
      )}

     
    </>
  );
}
