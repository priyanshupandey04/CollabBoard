"use client";

import React from "react";
import {
  Trash2,
  Hand,
  ZoomIn,
  ZoomOut,
  CornerUpLeft,
  CornerUpRight,
} from "lucide-react";

type ViewBox = { width: number; height: number; x?: number; y?: number };

type Props = {
  isErasing: boolean;
  setIsErasing: React.Dispatch<React.SetStateAction<boolean>>;
  isPanning: boolean;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  isTextEditing: boolean;
  setIsTextEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setDraggableId: React.Dispatch<React.SetStateAction<number | null>>;
  setArmedShape: (
    s: "rectangle" | "ellipse" | "line" | "path" | "text" | null
  ) => void;
  setShowEdit: (v: boolean) => void;
  setViewBox: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>
  >;
  safeUndo: () => void;
  safeRedo: () => void;
};

export default function CanvasToolbarControls({
  isErasing,
  setIsErasing,
  isPanning,
  setIsPanning,
  isTextEditing,
  setIsTextEditing,
  setDraggableId,
  setArmedShape,
  setShowEdit,
  setViewBox,
  safeUndo,
  safeRedo,
}: Props) {
  const disabled = isTextEditing || isErasing;

  const btnBase =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-shadow duration-150 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "dark:focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500";

  const disabledCls =
    "cursor-not-allowed opacity-60 border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500";

  const normalCls =
    "cursor-pointer border border-gray-200 bg-white text-gray-800 hover:shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Erase toggle - preserves original toggle logic and side-effects */}
      <button
        type="button"
        aria-pressed={isErasing}
        aria-label={isErasing ? "Stop erasing" : "Start erasing"}
        onClick={() =>
          setIsErasing((prev) => {
            const next = !prev;
            if (next) {
              // when entering erase mode disable selection/panning/drawing (keeps original logic)
              setIsPanning(false);
              setDraggableId(null);
              setArmedShape(null);
              setShowEdit(false);
              setIsTextEditing(false);
            }
            return next;
          })
        }
        className={`${btnBase} ${
          isErasing
            ? "bg-red-500 text-white border-red-500 shadow-md dark:bg-red-400"
            : "bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <Trash2 className="h-4 w-4" />
        </span>
        <span className="text-sm">
          {isErasing ? "Erasing (click shapes)" : "Erase"}
        </span>
      </button>

      {/* Panning - blocked when text editing or erasing (same guard as before) */}
      <button
        type="button"
        aria-pressed={isPanning}
        aria-label={isPanning ? "Stop panning" : "Start panning"}
        onClick={() => {
          if (isTextEditing || isErasing) return;
          setIsPanning(!isPanning);
        }}
        className={`${btnBase} ${
          disabled
            ? disabledCls
            : isPanning
            ? "bg-green-600 text-white border-green-600 shadow-md dark:bg-green-500"
            : normalCls
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <Hand className="h-4 w-4" />
        </span>
        <span className="text-sm">
          {isPanning ? "Stop Panning" : "Panning"}
        </span>
      </button>

      {/* Zoom in */}
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => {
          if (isTextEditing || isErasing) return;
          setViewBox((prev) => ({
            ...prev,
            width: prev.width / 1.1,
            height: prev.height / 1.1,
          }));
        }}
        className={`${btnBase} ${
          isTextEditing || isErasing ? disabledCls : normalCls
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <ZoomIn className="h-4 w-4" />
        </span>
        <span className="text-sm">Zoom in</span>
      </button>

      {/* Zoom out */}
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => {
          if (isTextEditing || isErasing) return;
          setViewBox((prev) => ({
            ...prev,
            width: prev.width * 1.1,
            height: prev.height * 1.1,
          }));
        }}
        className={`${btnBase} ${
          isTextEditing || isErasing ? disabledCls : normalCls
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <ZoomOut className="h-4 w-4" />
        </span>
        <span className="text-sm">Zoom out</span>
      </button>

      {/* Undo */}
      <button
        type="button"
        aria-label="Undo"
        onClick={() => {
          if (isTextEditing || isErasing) return;
          safeUndo();
        }}
        className={`${btnBase} ${
          isTextEditing || isErasing ? disabledCls : normalCls
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <CornerUpLeft className="h-4 w-4" />
        </span>
        <span className="text-sm">Undo</span>
      </button>

      {/* Redo */}
      <button
        type="button"
        aria-label="Redo"
        onClick={() => {
          if (isTextEditing || isErasing) return;
          safeRedo();
        }}
        className={`${btnBase} ${
          isTextEditing || isErasing ? disabledCls : normalCls
        }`}
      >
        <span
          className="flex-none rounded-sm p-1 bg-gray-50 dark:bg-gray-700/40"
          aria-hidden
        >
          <CornerUpRight className="h-4 w-4" />
        </span>
        <span className="text-sm">Redo</span>
      </button>
    </div>
  );
}
