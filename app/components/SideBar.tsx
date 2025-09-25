// app/components/SideBar.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useMutation, useStorage, useHistory } from "@liveblocks/react";

type Props = {
  id: number;
  onClose?: () => void;
};

/** Small curated palette (same style as SideBarText) */
const PALETTE = [
  "#ffffff",
  "#000000",
  "#f44336",
  "#ff9800",
  "#ffc107",
  "#ffeb3b",
  "#8bc34a",
  "#4caf50",
  "#00bcd4",
  "#2196f3",
  "#3f51b5",
  "#9c27b0",
  "#e91e63",
  "#795548",
  "#607d8b",
];

export default function SideBar({ id, onClose }: Props) {
  // Read shapes live (typed as any for simplicity)
  const shapes = useStorage((root: any) => (root ? (root as any).shapes : null)) as any;

  // local controlled inputs so the UI is snappy
  const [localStroke, setLocalStroke] = useState<string>("#ff0000");
  const [localFill, setLocalFill] = useState<string>("none");
  const [localStrokeWidth, setLocalStrokeWidth] = useState<number>(1);
  const { pause, resume } = useHistory();

  const mouseDownRef = useRef(false);

  // Mutation that writes strokeColor & fillColor into the shared shape
  const setShapeColors = useMutation(
    (
      { storage }: any,
      payload: { strokeColor?: string; fillColor?: string; strokeWidth?: number }
    ) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id);
      if (!existing) return;
      list.set(id, { ...existing, ...payload });
    },
    [id]
  );

  // Sync local inputs when shared shape or id changes
  useEffect(() => {
    try {
      const shared = shapes ? shapes[id] : undefined;
      if (shared) {
        const s = shared.strokeColor ?? "#ff0000";
        const f = shared.fillColor ?? "none";
        const w = shared.strokeWidth ?? 1;
        setLocalStroke(s);
        setLocalFill(f);
        setLocalStrokeWidth(w);
      }
    } catch (err) {
      // ignore
    }
  }, [shapes, id]);

  // Handlers for palette swatches:
  // - mousedown -> pause history (so rapid changes can be grouped)
  // - click -> apply change
  // - mouseup -> resume
  const handleSwatchMouseDown = () => {
    mouseDownRef.current = true;
    try {
      pause();
    } catch {}
  };
  const handleSwatchMouseUp = () => {
    mouseDownRef.current = false;
    try {
      resume();
    } catch {}
  };

  const applyStrokeColor = (hex: string) => {
    setLocalStroke(hex);
    // live-update
    setShapeColors({ strokeColor: hex });
  };

  const applyFillColor = (hexOrNone: string) => {
    setLocalFill(hexOrNone);
    setShapeColors({ fillColor: hexOrNone });
  };

  // Toggle fill between 'none' and a reasonable default (white)
  const onFillToggle = () => {
    const next = localFill === "none" ? "#ffffff" : "none";
    // group as single history action
    try {
      pause();
      setLocalFill(next);
      setShapeColors({ fillColor: next });
    } finally {
      try {
        resume();
      } catch {}
    }
  };

  // Stroke width slider behavior (pause while dragging, commit on blur)
  const onStrokeWidthFocus = () => {
    try {
      pause();
    } catch {}
  };
  const onStrokeWidthBlur = () => {
    try {
      setShapeColors({ strokeWidth: localStrokeWidth });
    } finally {
      try {
        resume();
      } catch {}
    }
  };

  return (
    <div
      className="
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        w-56 h-[56vh] p-4 rounded-l-2xl
        bg-white shadow-2xl text-left
        dark:bg-gray-900 dark:text-white
        flex flex-col gap-4
      "
      role="region"
      aria-label="Shape properties"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Shape properties</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onFillToggle}
            className="px-2 py-1 text-xs border rounded bg-gray-100 dark:bg-gray-800"
            title={localFill === "none" ? "Set fill (white)" : "Remove fill"}
          >
            {localFill === "none" ? "Set Fill" : "Remove Fill"}
          </button>
          <button
            onClick={() => onClose?.()}
            className="px-2 py-1 text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stroke color */}
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stroke color</div>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => {
            const active = c.toLowerCase() === (localStroke || "").toLowerCase();
            return (
              <button
                key={`stroke-${c}`}
                onMouseDown={handleSwatchMouseDown}
                onMouseUp={handleSwatchMouseUp}
                onClick={() => applyStrokeColor(c)}
                title={c}
                aria-label={`Set stroke color ${c}`}
                className={`w-8 h-8 rounded-md ring-1 ${
                  active ? "ring-offset-1 ring-2 ring-indigo-400" : "ring-gray-200 dark:ring-gray-700"
                }`}
                style={{ background: c }}
              />
            );
          })}
        </div>
      </div>

      {/* Fill color (limited swatches + 'none' indicated) */}
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fill color</div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onMouseDown={handleSwatchMouseDown}
            onMouseUp={handleSwatchMouseUp}
            onClick={() => applyFillColor("none")}
            title="None"
            aria-label="No fill"
            className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs ${
              localFill === "none" ? "ring-2 ring-indigo-400" : "bg-transparent"
            }`}
          >
            —
          </button>
          {PALETTE.map((c) => {
            const active =
              c.toLowerCase() === (localFill || "").toLowerCase() &&
              localFill !== "none";
            return (
              <button
                key={`fill-${c}`}
                onMouseDown={handleSwatchMouseDown}
                onMouseUp={handleSwatchMouseUp}
                onClick={() => applyFillColor(c)}
                title={c}
                aria-label={`Set fill color ${c}`}
                className={`w-8 h-8 rounded-md ring-1 ${
                  active ? "ring-offset-1 ring-2 ring-indigo-400" : "ring-gray-200 dark:ring-gray-700"
                }`}
                style={{ background: c }}
              />
            );
          })}
        </div>
      </div>

      {/* Stroke width */}
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stroke width</div>
        <input
          type="range"
          min={0}
          max={20}
          value={localStrokeWidth}
          onFocus={onStrokeWidthFocus}
          onBlur={onStrokeWidthBlur}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLocalStrokeWidth(v);
            // live-update while dragging — final commit happens on blur
            setShapeColors({ strokeWidth: v });
          }}
          className="w-full"
          aria-label="Stroke width"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current: {localStrokeWidth}px</div>
      </div>
    </div>
  );
}
