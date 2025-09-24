// app/components/Shapes/Line.tsx
"use client";

import { getMousePosition } from "@/app/utils/utils";
import { useEffect, useRef,
   useState } from "react";
import { useStorage, useMutation, useHistory } from "@liveblocks/react";

type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  draggableId: number | null;
  setDraggableId: React.Dispatch<React.SetStateAction<number | null>>;
  id: number; // index in shared shapes list
  isPanning: boolean;
  onSelect?: (id: number) => void; // ← new optional callback
  isTextEditing: boolean;
};

export const Line = ({
  x1,
  y1,
  x2,
  y2,
  draggableId,
  setDraggableId,
  id,
  isPanning,
  onSelect,
  isTextEditing,
}: Props) => {
  // Local coords state (keeps your render path/logic unchanged)
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number }>(
    { x1, y1, x2, y2 }
  );

  const [isClicked, setIsClicked] = useState(false);
  const [isDragging, setIsDragging] = useState<number>(0);
  const [showHandles, setShowHandles] = useState(false);
  const {pause, resume} = useHistory();

  const lastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handlesRef = useRef<SVGGElement | null>(null);
  const lineRef = useRef<SVGLineElement | null>(null);

  // Read shared shapes list from Liveblocks storage (typed as any to avoid TS errors)
  const shapes = useStorage((root: any) => (root && (root as any).shapes ? (root as any).shapes : null)) as any;
  const shared = shapes ? shapes[id] : undefined;
  const strokeColor = shared?.strokeColor ?? (draggableId === id ? "white" : "red");
  const fillColor = shared?.fillColor ?? "lightgreen";
  const strokeWidth = shared?.strokeWidth ?? 10;

  // Mutation: replace the element at index `id` with a merged object
  // Use a typed signature accepted by useMutation but cast storage to any inside.
  const replaceShapeAtIndex = useMutation(
    ({ storage }: any, patch: Partial<{ x1: number; y1: number; x2: number; y2: number }>) => {
      // storage is Liveblocks storage; cast to any to access .get/.set without TS errors
      const list = (storage as any).get("shapes") as any;
      if (!list) return;
      const existing = list.get(id);
      if (!existing) return;
      list.set(id, { ...existing, ...patch });
    },
    [id]
  );

  // When the shared shape changes (someone else moved/resized it), update local coords
  useEffect(() => {
      if(isTextEditing) return;
    try {
      const shared = shapes ? shapes[id] : undefined;
      if (shared && typeof shared === "object") {
        // only update if different to avoid feedback loops
        const nx1 = shared.x1 ?? shared.x ?? shared.cx ?? coords.x1;
        const ny1 = shared.y1 ?? shared.y ?? shared.cy ?? coords.y1;
        const nx2 = shared.x2 ?? coords.x2;
        const ny2 = shared.y2 ?? coords.y2;

        if (nx1 !== coords.x1 || ny1 !== coords.y1 || nx2 !== coords.x2 || ny2 !== coords.y2) {
          setCoords({ x1: nx1, y1: ny1, x2: nx2, y2: ny2 });
        }
      }
    } catch (err) {
      // defensive: shapes might be undefined during initialization
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, id]);

  useEffect(() => {
    
    if (isPanning || isTextEditing) return;
    if (isDragging === 0) return;

    let handleMouseMove: (e: MouseEvent) => void;

    if (isDragging === 1) {
      // dragging endpoint 1
      handleMouseMove = (e: MouseEvent) => {
        const { x: mouseX, y: mouseY } = getMousePosition(e as MouseEvent);
        // local immediate update for snappy UI
        setCoords((prev) => ({ ...prev, x1: mouseX, y1: mouseY }));
        // write to shared storage
        replaceShapeAtIndex({ x1: mouseX, y1: mouseY });
      };
    } else if (isDragging === 2) {
      // dragging endpoint 2
      handleMouseMove = (e: MouseEvent) => {
        const { x: mouseX, y: mouseY } = getMousePosition(e as MouseEvent);
        setCoords((prev) => ({ ...prev, x2: mouseX, y2: mouseY }));
        replaceShapeAtIndex({ x2: mouseX, y2: mouseY });
      };
    } else {
      // dragging whole line (mode 3)
      handleMouseMove = (e: MouseEvent) => {
        const { x: mouseX, y: mouseY } = getMousePosition(e as MouseEvent);
        const last = lastRef.current;
        const dx = mouseX - last.x;
        const dy = mouseY - last.y;

        // Use current local coords for delta (keeps core math same)
        setCoords((prev) => {
          const next = {
            x1: prev.x1 + dx,
            y1: prev.y1 + dy,
            x2: prev.x2 + dx,
            y2: prev.y2 + dy,
          };
          // push to live storage
          replaceShapeAtIndex(next);
          return next;
        });

        lastRef.current = { x: mouseX, y: mouseY };
      };
    }

    const handleMouseUp = () => {
      setIsDragging(0);
      resume();
      setDraggableId(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, replaceShapeAtIndex, setDraggableId, isPanning]);

  useEffect(() => {
    
    if (isPanning || isTextEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;

      const clickedInsideHandles = handlesRef.current && target && handlesRef.current.contains(target);

      const clickedInsideLine = lineRef.current && target && lineRef.current.contains(target);

      if (!clickedInsideHandles && !clickedInsideLine) {
        setShowHandles(false);
        // setDraggableId(null);
      }
    };

    if (showHandles) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHandles, setDraggableId, isPanning]);
  // console.log("Line");
  return (
    <>
        <line
          x1={coords.x1}
          y1={coords.y1}
          x2={coords.x2}
          y2={coords.y2}
          stroke={`${strokeColor}`}
          ref={lineRef}
          strokeWidth={strokeWidth}
          strokeLinecap="round" 
          onMouseDown={(e) => {
            if(isTextEditing) return;
            e.stopPropagation(); // ensure click doesn't bubble and immediately close handles
            setDraggableId(id);
            setIsDragging(3); // whole-line drag mode
            setShowHandles(true);
            pause();
            // initialize lastRef with current mouse pos so subsequent moves use correct delta
            const { x: mouseX, y: mouseY } = getMousePosition(e as React.MouseEvent);
            lastRef.current = { x: mouseX, y: mouseY };

            // notify parent selection
            if (onSelect) onSelect(id);
          }}
          className={`${draggableId === id ? "cursor-move" : ""}`}
          onClick={() => {
            if(isTextEditing) return;
            // ensure draggableId is set on click as before and also notify parent
            setDraggableId(id);
            if (onSelect) onSelect(id);
          }}
        />
        {showHandles && (
          <g ref={handlesRef}>
            <circle
              cx={coords.x1}
              cy={coords.y1}
              r={5}
              fill="blue"
              onMouseDown={(e) => {
                
                e.stopPropagation(); // prevent outside-click from closing handles
                setDraggableId(id);
                setIsDragging(1);
                pause();
                setShowHandles(true);
                if (onSelect) onSelect(id); // select when endpoint pressed
              }}
              className="hover:cursor-pointer"
            />
            <circle
              cx={coords.x2}
              cy={coords.y2}
              r={5}
              fill="blue"
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggableId(id);
                setIsDragging(2);
                pause();
                setShowHandles(true);
                if (onSelect) onSelect(id); // select when endpoint pressed
              }}
              className="hover:cursor-pointer"
            />
          </g>
        )}
    </>
  );
};

export default Line;
