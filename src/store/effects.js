import { useEffect } from "react";

const canAnimate = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Light 3D tilt for a card. Writes CSS variables inside requestAnimationFrame —
 * no React re-renders. Off on touch devices and for reduced-motion users.
 */
export function useTilt(ref, max = 7) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return;
    let raf = 0;
    let pt = null;

    const apply = () => {
      raf = 0;
      if (!pt) return;
      const r = el.getBoundingClientRect();
      const x = (pt.x - r.left) / r.width; // 0..1
      const y = (pt.y - r.top) / r.height;
      el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
    };
    const onMove = (e) => {
      pt = { x: e.clientX, y: e.clientY };
      el.classList.add("is-active");
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pt = null;
      el.classList.remove("is-active");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, max]);
}

/** Material-style ripple. Use as onPointerDown={ripple} on an element with class "ripple". */
export function ripple(e) {
  const el = e.currentTarget;
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const dot = document.createElement("span");
  dot.className = "ripple-dot";
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${e.clientX - r.left - size / 2}px`;
  dot.style.top = `${e.clientY - r.top - size / 2}px`;
  dot.addEventListener("animationend", () => dot.remove());
  el.appendChild(dot);
}
