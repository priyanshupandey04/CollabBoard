// components/ToolButton.tsx
"use client";

import React from "react";
import {
  Type as TypeIcon,
  PenTool,
  Square,
  Circle,
  Slash,
} from "lucide-react";

type Shape = "rectangle" | "ellipse" | "line" | "path" | "text" | null;

type Props = {
  isTextEditing: boolean;
  setArmedShape: React.Dispatch<React.SetStateAction<Shape>>;
  shape: Shape;
  children: React.ReactNode;
  isErasing: boolean;
};

export default function ToolButton({
  isTextEditing,
  setArmedShape,
  shape,
  children,
  isErasing,
}: Props) {
  const disabled = isTextEditing || isErasing;

  const icon = (() => {
    switch (shape) {
      case "text":
        return <TypeIcon className="h-4 w-4" />;
      case "path":
        return <PenTool className="h-4 w-4" />;
      case "rectangle":
        return <Square className="h-4 w-4" />;
      case "ellipse":
        return <Circle className="h-4 w-4" />;
      case "line":
        return <Slash className="h-4 w-4" />;
      default:
        return <PenTool className="h-4 w-4" />;
    }
  })();

  return (
    <button
      type="button"
      role="button"
      title={typeof children === "string" ? children : undefined}
      aria-label={typeof children === "string" ? children : undefined}
      aria-disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (shape) setArmedShape(shape);
      }}
      className={
        `flex items-center gap-2 rounded-md px-3 py-2 transition-shadow duration-150 select-none ` +
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ` +
        `focus-visible:ring-indigo-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ` +
        (disabled
          ? "cursor-not-allowed opacity-60 border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          : "cursor-pointer border border-gray-200 bg-white text-gray-800 hover:shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100")
      }
    >
      <span
        className={`flex-none rounded-sm p-1 ${
          disabled
            ? "bg-gray-100 dark:bg-gray-700"
            : "bg-gray-50 dark:bg-gray-700/40"
        }`}
        aria-hidden
      >
        {icon}
      </span>

      <span className="text-sm font-medium leading-none">{children}</span>
    </button>
  );
}
