import { useEffect } from "react";

const canAnimate = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Smooth hover motion for cards and mockups.
 * - Values glide toward the pointer with inertia (lerp inside requestAnimationFrame),
 *   so movement never snaps or jitters.
 * - `max` = tilt in degrees (0 = no tilt, only lift + light glare — the calm "pro" default).
 * - `lift` = px the element rises on hover.
 * Writes CSS variables only: no React re-renders. Off on touch & reduced-motion.
 */
export function useTilt(ref, max = 0, lift = 6) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return;
    const EASE = 0.12; // lower = softer
    const cur = { rx: 0, ry: 0, l: 0, gx: 50, gy: 0 };
    const tgt = { rx: 0, ry: 0, l: 0, gx: 50, gy: 0 };
    let raf = 0;

    const tick = () => {
      let moving = false;
      for (const k in cur) {
        const d = tgt[k] - cur[k];
        if (Math.abs(d) > 0.01) {
          cur[k] += d * EASE;
          moving = true;
        } else cur[k] = tgt[k];
      }
      el.style.setProperty("--rx", `${cur.rx.toFixed(3)}deg`);
      el.style.setProperty("--ry", `${cur.ry.toFixed(3)}deg`);
      el.style.setProperty("--lift", `${cur.l.toFixed(2)}px`);
      el.style.setProperty("--gx", `${cur.gx.toFixed(1)}%`);
      el.style.setProperty("--gy", `${cur.gy.toFixed(1)}%`);
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tgt.ry = (x - 0.5) * 2 * max;
      tgt.rx = (0.5 - y) * 2 * max;
      tgt.gx = x * 100;
      tgt.gy = y * 100;
      tgt.l = -lift;
      kick();
    };
    const onEnter = () => {
      el.classList.add("is-active");
      tgt.l = -lift;
      kick();
    };
    const onLeave = () => {
      el.classList.remove("is-active");
      tgt.rx = tgt.ry = tgt.l = 0;
      kick();
    };

    el.classList.add("tilt-js");
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.classList.remove("tilt-js", "is-active");
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, max, lift]);
}

/** Shared easing for Framer Motion — smooth "expo-out", used everywhere in the store. */
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const smooth = (delay = 0, duration = 0.8) => ({ duration, ease: EASE_OUT, delay });

/** Material-style ripple. Use as onPointerDown={ripple} on an element with class "ripple". */
export function ripple(e) {
  const el = e.currentTarget;
  // Mouse only: on touch screens a finger that starts a scroll on the button would
  // otherwise trigger the ripple, making the button look like it "stretches".
  if (!el || (e.pointerType && e.pointerType !== "mouse")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
