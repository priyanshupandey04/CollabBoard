

// app/utils/utils.ts
export type AnyMouseEvent = MouseEvent | React.MouseEvent;

function clientCoordsFromEvent(e: AnyMouseEvent | TouchEvent) {
  if ("clientX" in e && typeof e.clientX === "number") {
    return { clientX: e.clientX, clientY: e.clientY };
  }
  // TouchEvent
  const touch = (e as TouchEvent).touches?.[0] ?? (e as TouchEvent).changedTouches?.[0];
  if (touch) return { clientX: touch.clientX, clientY: touch.clientY };
  throw new Error("Unable to read client coords from event");
}

/**
 * Returns { x, y } coordinates in SVG user space.
 * - e: native MouseEvent / TouchEvent OR React.MouseEvent (we use nativeEvent when calling from React)
 * - svgEl: optional SVGElement to compute against — strongly recommended
 */
export function getMousePosition(
  e: AnyMouseEvent | TouchEvent,
  svgEl?: SVGSVGElement | null
) {
  const { clientX, clientY } = clientCoordsFromEvent(e as any);

  // Prefer explicit SVG element passed by caller
  let svg: SVGSVGElement | null = (svgEl as SVGSVGElement | null) ?? null;

  // If not provided, try to infer from event target
  if (!svg) {
    const target = (e as any).target as Element | undefined;
    svg = target?.closest ? (target.closest("svg") as SVGSVGElement | null) : null;
  }

  // Last resort: first svg in document (avoid if possible)
  if (!svg) {
    svg = document.querySelector("svg");
  }

  if (!svg) {
    // can't compute without an svg reference
    return { x: clientX, y: clientY };
  }

  // Try the matrix transform approach (best accuracy)
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const screenCTM = svg.getScreenCTM?.();
  if (screenCTM) {
    const inv = screenCTM.inverse();
    const p = pt.matrixTransform(inv);
    return { x: p.x, y: p.y };
  }

  // Fallback: compute relative to bounding rect + viewBox scaling
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if (vb && rect.width > 0 && rect.height > 0) {
    const scaleX = vb.width / rect.width;
    const scaleY = vb.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX + vb.x,
      y: (clientY - rect.top) * scaleY + vb.y,
    };
  }

  // Last fallback — return raw client coords
  return { x: clientX, y: clientY };
}

 // Turn the points returned from perfect-freehand into SVG path data.

export function getSvgPathFromStroke(stroke : number[][]) {
  if (!stroke.length) return ""

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ["M", ...stroke[0], "Q"]
  )

  d.push("Z")
  return d.join(" ")
}
