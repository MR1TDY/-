export function parseIds(text) {
  return String(text || '')
    .split(/[,]/g)
    .map(s => s.trim())
    .filter(Boolean);
}