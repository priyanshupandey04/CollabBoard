// app/components/Erase.tsx
"use client";
import React from "react";

type ShapeName = "rectangle" | "ellipse" | "line" | "path" | "text" | "erase" | null;

type Props = {
  isActive: boolean; // whether erase mode is currently active
  isTextEditing: boolean; // true when user is editing text (disable toggle)
  setArmedShape: React.Dispatch<React.SetStateAction<ShapeName>>;
  // optional helpers so the button can clear selection / stop panning/dragging
  setDraggableId?: React.Dispatch<React.SetStateAction<number | null>>;
  setIsPanning?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDragging?: React.Dispatch<React.SetStateAction<boolean>>;
};

const Erase: React.FC<Props> = ({
  isActive,
  isTextEditing,
  setArmedShape,
  setDraggableId,
  setIsPanning,
  setIsDragging,
}) => {
  const toggleErase = () => {
    if (isTextEditing) return;
    setArmedShape((prev) => (prev === "erase" ? null : "erase"));
    // clear selection and interactions when entering erase mode
    if (!isActive) {
      if (setDraggableId) setDraggableId(null);
      if (setIsPanning) setIsPanning(false);
      if (setIsDragging) setIsDragging(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleErase();
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      title={isActive ? "Erase mode (active)" : "Enter erase mode"}
      onClick={toggleErase}
      onKeyDown={onKeyDown}
      className={`border border-black px-4 py-2 focus:outline-none ${
        isActive ? "bg-red-400 text-white" : "bg-white text-black"
      }`}
    >
      Erase
    </button>
  );
};

export default Erase;
