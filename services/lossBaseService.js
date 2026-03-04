
import { getSettings } from './settingsService.js';

export async function getMemberDebaterLossBase(guild, member) {
  const settings = await getSettings();
  const ranks = settings?.debaterRanks || [];
  if (!ranks.length) return 50; // fallback

  // نرتب الرتب تصاعدي
  const sorted = [...ranks].sort((a, b) => (a.winsToPromote || 0) - (b.winsToPromote || 0));

  // نجيب أعلى رتبة يملكها العضو
  let currentRank = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const roleId = sorted[i]?.roleId;
    if (roleId && member.roles.cache.has(String(roleId))) {
      currentRank = sorted[i];
      break;
    }
  }

  const base = Number(currentRank?.lossDeductionBase || 0);

  // إذا ما عنده رتبة من نظام المناقشين، ناخذ أول رتبة كمرجع (أو 50)
  if (!currentRank) {
    const firstBase = Number(sorted[0]?.lossDeductionBase || 0);
    return firstBase || 50;
  }

  return base || 50;
}