// Shared animation presets — one spring for the whole site keeps motion consistent.
export const spring = { type: "spring", stiffness: 120, damping: 20 };
export const softSpring = { type: "spring", stiffness: 260, damping: 30 };

// Smooth "expo-out" curve for entrances — calm, no bounce.
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const ease = { duration: 0.8, ease: EASE_OUT };

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { ...ease, delay },
});
