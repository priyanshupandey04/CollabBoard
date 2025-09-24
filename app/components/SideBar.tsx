// app/components/SideBar.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useStorage, useHistory } from "@liveblocks/react";

type Props = {
  id: number;
  onClose?: () => void;
};

export default function SideBar({ id, onClose }: Props) {
  // Read shapes live (typed as any for simplicity)
  const shapes = useStorage((root: any) => (root ? (root as any).shapes : null)) as any;

  // local controlled inputs so the UI is snappy
  const [localStroke, setLocalStroke] = useState<string>("#ff0000");
  const [localFill, setLocalFill] = useState<string>("none");
  const [localStrokeWidth, setLocalStrokeWidth] = useState<number>(1);
  const { pause, resume } = useHistory();

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

  // handlers
  const onStrokeChange = (v: string) => {
    setLocalStroke(v);
    // write live-update (will be grouped into a single history entry if paused)
    setShapeColors({ strokeColor: v });
  };

  // Fill: pause history while user interacts with the color picker,
  // commit final value on blur so only one history entry is recorded.
  const onFillChange = (v: string) => {
    setLocalFill(v);
    // live-update while history is paused (so others see it)
    setShapeColors({ fillColor: v });
  };

  const onFillToggle = () => {
    // toggle between none and white fallback — do as a single history action
    const next = localFill === "none" ? "#ffffff" : "none";
    setLocalFill(next);
    pause();
    setShapeColors({ fillColor: next });
    resume();
  };

  return (
    <div
      className="
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        w-48 h-[50vh] bg-white shadow-2xl text-center p-4
        flex flex-col items-center justify-start gap-4 select-none
      "
    >
      <div className="w-full flex justify-between items-center">
        <h4 className="font-medium ">Shape properties</h4>
        <button
          onClick={() => onClose?.()}
          className="text-gray-600 hover:text-black"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="w-full">
        <label className="block text-left text-sm text-gray-600 mb-1">Stroke color</label>
        {/* color input */}
        <input
          value={localStroke}
          onChange={(e) => onStrokeChange(e.target.value)}
          onFocus={() => {
            // pause history while user manipulates stroke color picker
            pause();
          }}
          onBlur={() => {
            // commit final stroke color and resume -> single history entry
            setShapeColors({ strokeColor: localStroke });
            resume();
          }}
          type="color"
          className="w-full h-10 p-1"
        />
      </div>

      <div className="w-full">
        <label className="block text-left text-sm text-gray-600 mb-1">Fill color</label>
        {/* allow "none" or color - small UI: color input + "none" toggle */}
        <div className="flex gap-2 items-center">
          <input
            value={localFill === "none" ? "#ffffff" : localFill}
            onChange={(e) => {
              const val = e.target.value;
              onFillChange(val);
            }}
            onFocus={() => {
              // pause history while the user is manipulating the color picker
              pause();
              // console.log("focus");
            }}
            onBlur={() => {
              // commit final value as a single history step and resume
              setShapeColors({ fillColor: localFill });
              resume();
              // console.log("blur");
            }}
            type="color"
            className="w-full h-10 p-1"
          />
          <button
            onClick={() => {
              onFillToggle();
            }}
            className="px-2 py-1 border rounded text-sm"
            title="Toggle none"
          >
            {localFill === "none" ? "Set" : "None"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Toggle fill "none" to disable path fill.
        </p>
      </div>
      <div className="w-full">
        <label className="block text-left text-sm text-gray-600 mb-1">Stroke width</label>
        <input
          value={localStrokeWidth}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val: number = Number(e.target.value);
            setLocalStrokeWidth(val);
            // live-update while user interacts; grouped if paused
            setShapeColors({ strokeWidth: val });
          }}
          onFocus={() => {
            // pause history while the user is changing the width
            pause();
          }}
          onBlur={() => {
            // commit final width and resume -> single history entry
            setShapeColors({ strokeWidth: localStrokeWidth });
            resume();
          }}
          type="number"
          className="w-full h-10 p-1 select-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Stroke width.
        </p>
      </div>
    </div>
  );
}
