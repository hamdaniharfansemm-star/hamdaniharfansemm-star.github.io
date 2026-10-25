// Shared animation presets — one spring for the whole site keeps motion consistent.
export const spring = { type: "spring", stiffness: 120, damping: 20 };
export const softSpring = { type: "spring", stiffness: 260, damping: 30 };

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { ...spring, delay },
});
