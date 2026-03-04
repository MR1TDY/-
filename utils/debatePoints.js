export function winPointsByColor(color) {
  const map = { white: 1, green: 3, yellow: 5, red: 10, black: 15 };
  return map[color] ?? 1;
}

export function lossPenaltyByColor(color, baseLoss = 50) {
  const ratios = { white: 1.0, green: 0.75, yellow: 0.5, red: 0.25, black: 0.05 };
  const r = ratios[color] ?? 1.0;
  return Math.round(baseLoss * r);
}