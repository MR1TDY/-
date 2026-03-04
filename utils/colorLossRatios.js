export const COLOR_LOSS_RATIO = {
  white: 1.0,
  green: 0.75,
  yellow: 0.5,
  red: 0.25,
  black: 0.05
};

export function getLossRatioByColor(color) {
  const c = String(color || '').toLowerCase();
  return COLOR_LOSS_RATIO[c] ?? 1.0;
}