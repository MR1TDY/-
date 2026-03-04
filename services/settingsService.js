
import Settings from '../models/Settings.js';

let cachedSettings = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000;

export async function getSettings() {
  const now = Date.now();
  if (cachedSettings && (now - cacheTime) < CACHE_TTL) return cachedSettings;

  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});

  cachedSettings = s;
  cacheTime = now;
  return s;
}

export function clearSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}

export function getScoreSystem(settings, key) {
  if (!settings?.scoreRankSystems) return null;
  return settings.scoreRankSystems.find(s => s.key === key) || null;
}