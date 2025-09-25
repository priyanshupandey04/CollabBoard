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
  content: string;
  showEdit: boolean;
  setShowEdit: React.Dispatch<React.SetStateAction<boolean>>;
  isTextEditing: boolean;
  setIsTextEditing: React.Dispatch<React.SetStateAction<boolean>>;
  // shared ref used to prevent text blur when interacting with sidebar
  suppressBlurRef?: React.MutableRefObject<boolean | null>;
};

export default function Text({
  id,
  x,
  y,
  draggableId,
  setDraggableId,
  isPanning,
  viewBox,
  content,
  showEdit,
  setShowEdit,
  isTextEditing,
  setIsTextEditing,
  suppressBlurRef,
}: Props) {
  const [coords, setCoords] = useState({ x, y, width: 100, height: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [resizableOption, setResizableOption] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
  const [text, setText] = useState(content);
  const rectangle = useRef<SVGRectElement | null>(null);
  const handlesRef = useRef<SVGGElement | null>(null);
  const { pause, resume } = useHistory();

  const shapes = useStorage((root: any) =>
    root ? (root as any).shapes : null
  ) as any;

  // mutation to update shape meta (position/size/style)
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
        fontSize?: number;
        fontFamily?: string;
        fontWeight?: string;
        textAlign?: string;
        lineHeight?: number;
        letterSpacing?: number;
        padding?: number;
        textColor?: string;
        bgColor?: string;
      }>
    ) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id) ?? {};
      list.set(id, { ...existing, ...patch });
    },
    [id]
  );

  // mutation to update text content live
  const replaceTextAtIndex = useMutation(
    ({ storage }: any, patch: { content: string }) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id) ?? {};
      list.set(id, { ...existing, content: patch.content });
    },
    [id]
  );

  // --- style states (local mirror of remote) ---
  const [fontSizeState, setFontSizeState] = useState<number>(16);
  const [fontFamilyState, setFontFamilyState] = useState<string>("monospace");
  const [fontWeightState, setFontWeightState] = useState<string>("600");
  const [textAlignState, setTextAlignState] = useState<string>("left");
  const [lineHeightState, setLineHeightState] = useState<number>(1.1);
  const [letterSpacingState, setLetterSpacingState] = useState<number>(0);
  const [paddingState, setPaddingState] = useState<number>(8);
  const [textColorState, setTextColorState] = useState<string>("#ffffff");
  const [bgColorState, setBgColorState] = useState<string>("transparent");

  // sync remote -> local: coords, text, and all style props
  useEffect(() => {
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

        // text
        const remoteText = shared.content ?? content;
        if (remoteText !== text) {
          setText(remoteText);
        }

        // style properties:
        if (
          typeof shared.fontSize === "number" &&
          shared.fontSize !== fontSizeState
        ) {
          setFontSizeState(shared.fontSize);
        }
        if (
          typeof shared.fontFamily === "string" &&
          shared.fontFamily !== fontFamilyState
        ) {
          setFontFamilyState(shared.fontFamily);
        }
        if (
          typeof shared.fontWeight === "string" &&
          shared.fontWeight !== fontWeightState
        ) {
          setFontWeightState(shared.fontWeight);
        }
        if (
          typeof shared.textAlign === "string" &&
          shared.textAlign !== textAlignState
        ) {
          setTextAlignState(shared.textAlign);
        }
        if (
          typeof shared.lineHeight === "number" &&
          shared.lineHeight !== lineHeightState
        ) {
          setLineHeightState(shared.lineHeight);
        }
        if (
          typeof shared.letterSpacing === "number" &&
          shared.letterSpacing !== letterSpacingState
        ) {
          setLetterSpacingState(shared.letterSpacing);
        }
        if (
          typeof shared.padding === "number" &&
          shared.padding !== paddingState
        ) {
          setPaddingState(shared.padding);
        }
        if (
          typeof shared.textColor === "string" &&
          shared.textColor !== textColorState
        ) {
          setTextColorState(shared.textColor);
        }
        if (
          typeof shared.bgColor === "string" &&
          shared.bgColor !== bgColorState
        ) {
          setBgColorState(shared.bgColor);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, id]);

  // dragging / resizing (unchanged)
  // widen event type so it works on both <rect> (SVGRectElement) and <div> (HTMLDivElement)
  const handleMouseDown = (
    e: React.MouseEvent<HTMLElement | SVGRectElement, MouseEvent>
  ) => {
    if (isPanning || showEdit) return;
    setDraggableId(id);
    setStrokeWidth(1);

    // getMousePosition expects a native MouseEvent — use nativeEvent which is the underlying DOM MouseEvent
    const { x: mouseX, y: mouseY } = getMousePosition(e.nativeEvent);

    setOffset({ x: mouseX - coords.x, y: mouseY - coords.y });

    setShowHandles(true);
    setIsDragging(true);

    pause();
  };

  useEffect(() => {
    if (isPanning) return;
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

  // hide handles when clicking outside (but keep open if user is interacting with sidebar)
  useEffect(() => {
    if (isPanning) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        handlesRef.current &&
        !handlesRef.current.contains(e.target as Node) &&
        rectangle.current &&
        !rectangle.current.contains(e.target as Node)
      ) {
        if (isTextEditing) return; // don't hide when sidebar interaction is active
        setShowHandles(false);
        setStrokeWidth(0);
      }
    };
    if (showHandles) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHandles, isPanning, isTextEditing]);

  // style values from shared
  const shared = shapes ? shapes[id] : undefined;
  const strokeColor =
    shared?.strokeColor ?? (draggableId === id ? "blue" : "red");
  const fillColor = shared?.fillColor ?? "transparent";
  let strokeWidth = shared?.strokeWidth ?? 0;
  const [strokeWidthState, setStrokeWidth] = useState(strokeWidth);
  const radius = shared?.rx ?? 20;

  return (
    <>
      {/* rectangle frame */}
      <rect
        x={coords.x}
        y={coords.y}
        ref={rectangle}
        width={coords.width}
        height={coords.height}
        stroke={strokeColor}
        strokeWidth={strokeWidthState}
        fill={fillColor}
        rx={radius}
        ry={radius}
        onMouseDown={handleMouseDown}
        style={{ cursor: draggableId === id ? "move" : "default" }}
        onClick={() => setDraggableId(id)}
      />

      {/* text content */}
      <foreignObject
        x={coords.x}
        y={coords.y}
        width={coords.width}
        height={coords.height}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: `${paddingState}px`,
            boxSizing: "border-box",
            fontFamily: fontFamilyState,
            fontWeight: fontWeightState,
            fontSize: `${fontSizeState}px`,
            lineHeight: lineHeightState,
            letterSpacing: `${letterSpacingState}px`,
            overflow: "hidden",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            color: textColorState,
            background:
              bgColorState === "transparent" ? "transparent" : bgColorState,
            display: "flex",
            alignItems: "flex-start",
            textAlign: textAlignState as any,
          }}
          onMouseDown={handleMouseDown}
        >
          {!showEdit && (
            <p
              onDoubleClick={() => {
                if (isPanning || isTextEditing) return;
                setShowEdit(true);
                setIsTextEditing(true);
                setStrokeWidth(3);
                setDraggableId(id);
                setShowHandles(true);
                // removed setShowSidebar(true) here (was causing TS error)
              }}
              className="text-wrap w-full"
              style={{ margin: 0, width: "100%" }}
            >
              {text}
            </p>
          )}

          {showEdit && (
            <textarea
              value={text}
              onChange={(e) => {
                if (isTextEditing && draggableId != id) return;
                setText(e.target.value);
                // live persist for collaborators
                replaceTextAtIndex({ content: e.target.value });
              }}
              disabled={isTextEditing && draggableId !== id}
              className={`w-full min-h-full text-wrap overflow-y-auto resize-none overflow-y-hidden`}
              style={{
                fontSize: `${fontSizeState}px`,
                lineHeight: lineHeightState,
                fontFamily: fontFamilyState,
                fontWeight: fontWeightState,
                letterSpacing: `${letterSpacingState}px`,
                color: textColorState,
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                margin: 0,
                width: "100%",
                boxSizing: "border-box",
                textAlign: textAlignState as any,
              }}
              onBlur={() => {
                // If suppressBlurRef is set by the sidebar (user clicked in sidebar),
                // don't close edit mode.
                if (suppressBlurRef?.current) {
                  // leave showEdit true — the sidebar will clear the ref on mouseup
                  return;
                }
                if (isTextEditing) {
                  // if parent indicates text editing flag, don't close yet
                  return;
                }
                setShowEdit(false);
                setStrokeWidth(0);
                // final persist
                replaceTextAtIndex({ content: text });
              }}
              autoFocus
            />
          )}
        </div>
      </foreignObject>

      {/* resize handles */}
      {showHandles && (
        <g ref={handlesRef}>
          <rect
            x={`${coords.x + coords.width - 5 - (5 * viewBox.width) / 2000}`}
            y={`${coords.y + coords.height - 5 - (5 * viewBox.width) / 2000}`}
            width={`${(20 * viewBox.width) / 2000}px`}
            height={`${(20 * viewBox.width) / 2000}px`}
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
            x={coords.x + coords.width - 5 - (5 * viewBox.width) / 2000}
            y={coords.y - 5 - (5 * viewBox.width) / 2000}
            width={`${(20 * viewBox.width) / 2000}px`}
            height={`${(20 * viewBox.width) / 2000}px`}
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
            x={coords.x - 5 - (5 * viewBox.width) / 2000}
            y={coords.y + coords.height - 5 - (5 * viewBox.width) / 2000}
            width={`${(20 * viewBox.width) / 2000}px`}
            height={`${(20 * viewBox.width) / 2000}px`}
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
            x={coords.x - 5 - (5 * viewBox.width) / 2000}
            y={coords.y - 5 - (5 * viewBox.width) / 2000}
            width={`${(20 * viewBox.width) / 2000}px`}
            height={`${(20 * viewBox.width) / 2000}px`}
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
