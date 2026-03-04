export function winPointsAsJudge(color) {
  const map = { white: 1, green: 3, yellow: 5, red: 10, black: 15 };
  return map[color] ?? 1;
}

export function winPointsAsOpposer(color) {
  const map = { white: 15, green: 10, yellow: 5, red: 3, black: 1 };
  return map[color] ?? 1;
}