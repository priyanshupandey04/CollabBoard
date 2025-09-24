// app/components/SideBarText.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useStorage, useMutation, useHistory } from "@liveblocks/react";

type Props = {
  id: number;
  onClose: () => void;
  suppressBlurRef?: React.MutableRefObject<boolean | null>;
  setIsTextEditing?: React.Dispatch<React.SetStateAction<boolean>>;
};

const fontButtonOptions = [
  { label: "Sans", value: "Arial, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "Courier New, monospace" },
  { label: "Fantasy", value: "Impact, Charcoal, sans-serif" },
  { label: "Script", value: "Brush Script MT, cursive" },
  {
    label: "System",
    value:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  },
  { label: "Monospace", value: "'Andale Mono', Consolas, monospace" },
  {
    label: "Cursive",
    value: "'Monotype Corsiva', 'URW Chancery L', cursive",
  },
  { label: "Comic", value: "'Comic Sans MS', 'Comic Sans', cursive" },
];

// handy default palette (feel free to tweak)
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

export default function SideBarText({
  id,
  onClose,
  suppressBlurRef,
  setIsTextEditing,
}: Props) {
  const localMouseDown = useRef(false);
  const shapes = useStorage((root: any) =>
    root ? (root as any).shapes : null
  ) as any;

  const updateShape = useMutation(
    ({ storage }: any, patch: any) => {
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id) ?? {};
      list.set(id, { ...existing, ...patch });
    },
    [id]
  );

  const { pause, resume } = useHistory();

  const shape = shapes ? shapes[id] : null;
  if (!shape) return null;

  const [fontSize, setFontSize] = useState<number>(shape.fontSize ?? 16);
  const [fontFamily, setFontFamily] = useState<string>(
    shape.fontFamily ?? "Arial, sans-serif"
  );
  const [fontWeight, setFontWeight] = useState<string>(
    shape.fontWeight ?? "normal"
  );
  const [textAlign, setTextAlign] = useState<string>(shape.textAlign ?? "left");
  const [lineHeight, setLineHeight] = useState<number>(shape.lineHeight ?? 1.2);
  const [letterSpacing, setLetterSpacing] = useState<number>(
    shape.letterSpacing ?? 0
  );
  const [paddingVal, setPaddingVal] = useState<number>(shape.padding ?? 0);
  const [textColor, setTextColor] = useState<string>(
    shape.textColor ?? "#ffffff"
  );
  const [bgColor, setBgColor] = useState<string>(
    shape.bgColor ?? "transparent"
  );

  // sync local state -> but only when value actually differs (prevents loops)
  useEffect(() => {
    if (!shape) return;

    if ((shape.fontSize ?? 16) !== fontSize) setFontSize(shape.fontSize ?? 16);
    if ((shape.fontFamily ?? "Arial, sans-serif") !== fontFamily)
      setFontFamily(shape.fontFamily ?? "Arial, sans-serif");
    if ((shape.fontWeight ?? "normal") !== fontWeight)
      setFontWeight(shape.fontWeight ?? "normal");
    if ((shape.textAlign ?? "left") !== textAlign)
      setTextAlign(shape.textAlign ?? "left");
    if ((shape.lineHeight ?? 1.2) !== lineHeight)
      setLineHeight(shape.lineHeight ?? 1.2);
    if ((shape.letterSpacing ?? 0) !== letterSpacing)
      setLetterSpacing(shape.letterSpacing ?? 0);
    if ((shape.padding ?? 0) !== paddingVal) setPaddingVal(shape.padding ?? 0);
    if ((shape.textColor ?? "#ffffff") !== textColor)
      setTextColor(shape.textColor ?? "#ffffff");
    if ((shape.bgColor ?? "transparent") !== bgColor)
      setBgColor(shape.bgColor ?? "transparent");
  }, [shape]);

  const replaceShapeAtIndex = (patch: any) => updateShape(patch);

  // helper for swatch click
  const applyTextColor = (hex: string) => {
    setTextColor(hex);
    replaceShapeAtIndex({ textColor: hex });
  };
  const applyBgColor = (hexOrTransparent: string) => {
    setBgColor(hexOrTransparent);
    replaceShapeAtIndex({ bgColor: hexOrTransparent });
  };

  return (
    <aside
      onMouseDown={() => {
        localMouseDown.current = true;
        if (suppressBlurRef) suppressBlurRef.current = true;
        if (setIsTextEditing) setIsTextEditing(true);
      }}
      onMouseUp={() => {
        localMouseDown.current = false;
        setTimeout(() => {
          if (suppressBlurRef) suppressBlurRef.current = false;
          if (setIsTextEditing) setIsTextEditing(false);
        }, 0);
      }}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: 360,
        background: "#071226",
        color: "#fff",
        padding: 16,
        boxSizing: "border-box",
        boxShadow: "-6px 0 24px rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 style={{ margin: 0 }}>Text Editor</h4>
        <button
          onClick={() => {
            onClose();
          }}
          style={{
            background: "transparent",
            border: "1px solid #213247",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontSize: 12, color: "#9fb0c6" }}>
        Edit text properties — changes are saved live (sliders pause history
        while dragging).
      </div>
          
      {/* Font size */}
      <div>
        <label>Font size ({fontSize}px)</label>
        <input
          type="range"
          min={8}
          max={200}
          value={fontSize}
          onMouseDown={() => {
            try {
              pause();
            } catch {}
          }}
          onMouseUp={() => {
            try {
              resume();
            } catch {}
          }}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFontSize(v);
            replaceShapeAtIndex({ fontSize: v });
          }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Font family (now a dropdown) */}
      <div>
        <label style={{ display: "block", marginBottom: 6 }}>Font family</label>
        <select
          value={fontFamily}
          onChange={(e) => {
            const v = e.target.value;
            setFontFamily(v);
            replaceShapeAtIndex({ fontFamily: v });
          }}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 6,
            background: "#0b1621",
            color: "#fff",
            border: "1px solid #223244",
            boxSizing: "border-box",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
        >
          {fontButtonOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Weight */}
      <div>
        <div style={{ marginBottom: 6 }}>Weight</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["normal", "bold"].map((w) => (
            <button
              key={w}
              onClick={() => {
                setFontWeight(w);
                replaceShapeAtIndex({ fontWeight: w });
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border:
                  fontWeight === w ? "2px solid #6DCDEC" : "1px solid #223244",
                background: fontWeight === w ? "#0f2333" : "#0b1621",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <div style={{ marginBottom: 6 }}>Alignment</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              onClick={() => {
                setTextAlign(a);
                replaceShapeAtIndex({ textAlign: a });
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border:
                  textAlign === a ? "2px solid #6DCDEC" : "1px solid #223244",
                background: textAlign === a ? "#0f2333" : "#0b1621",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Line height */}
      <div>
        <label>Line height ({lineHeight.toFixed(2)})</label>
        <input
          type="range"
          min={0.8}
          max={3}
          step={0.01}
          value={lineHeight}
          onMouseDown={() => {
            try {
              pause();
            } catch {}
          }}
          onMouseUp={() => {
            try {
              resume();
            } catch {}
          }}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLineHeight(v);
            replaceShapeAtIndex({ lineHeight: v });
          }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Letter spacing */}
      <div>
        <label>Letter spacing ({letterSpacing}px)</label>
        <input
          type="range"
          min={-5}
          max={40}
          step={0.5}
          value={letterSpacing}
          onMouseDown={() => {
            try {
              pause();
            } catch {}
          }}
          onMouseUp={() => {
            try {
              resume();
            } catch {}
          }}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLetterSpacing(v);
            replaceShapeAtIndex({ letterSpacing: v });
          }}
          style={{ width: "100%" }}
        />
      </div>

      {/* Color swatches */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>Text color</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PALETTE.map((c) => {
              const active =
                c.toLowerCase() === (textColor || "").toLowerCase();
              return (
                <button
                  key={`text-${c}`}
                  title={c}
                  onClick={() => applyTextColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: active
                      ? "3px solid #6DCDEC"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: c,
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>Background</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["transparent", ...PALETTE].map((c) => {
              const val = c === "transparent" ? "transparent" : c;
              const active =
                (val === "transparent" && bgColor === "transparent") ||
                (val !== "transparent" &&
                  bgColor?.toLowerCase() === val.toLowerCase());
              return (
                <button
                  key={`bg-${c}`}
                  title={c}
                  onClick={() => applyBgColor(val)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: active
                      ? "3px solid #6DCDEC"
                      : "1px solid rgba(255,255,255,0.12)",
                    background:
                      val === "transparent"
                        ? "repeating-conic-gradient(#fff 0% 25%, #ccc 0% 50%)"
                        : val,
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
