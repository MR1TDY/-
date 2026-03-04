import { getSettings } from './settingsService.js';
import Stats from '../models/Stats.js';

export async function applyJudgeRank(guild, member) {
  try {
    const settings = await getSettings();
    const ranks = settings?.judgeRanks;
    if (!ranks || ranks.length === 0) return { applied: false, reason: 'no_ranks' };

    const stats = await Stats.findOne({ userId: member.id });
    const judged = Number(stats?.judgeCount || 0);

    const sorted = [...ranks].sort((a, b) => (a.judgedToPromote || 0) - (b.judgedToPromote || 0));

    let bestRank = null;
    for (const rank of sorted) {
      if (!rank.autoPromote) continue;
      if (judged >= (rank.judgedToPromote || 0)) {
        bestRank = rank;
      }
    }

    let currentRankIndex = -1;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].roleId && member.roles.cache.has(sorted[i].roleId)) {
        currentRankIndex = i;
        break;
      }
    }

    let targetRank = bestRank;

    if (currentRankIndex >= 0) {
      const currentRank = sorted[currentRankIndex];
      const errorLimit = currentRank.errorsToDemote || 0;

      // الهبوط للحكام بناءً على "أخطاء" - تقدر تضيف حقل errors في Stats لاحقاً
      // حالياً نخليه يصعد بس
      const bestIndex = sorted.indexOf(bestRank);
      if (bestRank && bestIndex > currentRankIndex) {
        targetRank = bestRank;
      } else {
        targetRank = currentRank;
      }
    }

    const allRoleIds = sorted.map(r => r.roleId).filter(Boolean);
    const targetRoleId = targetRank?.roleId || null;

    const botMe = guild.members.me;
    if (!botMe?.permissions.has('ManageRoles')) {
      return { applied: false, reason: 'no_manage_roles' };
    }

    for (const rid of allRoleIds) {
      if (rid !== targetRoleId && member.roles.cache.has(rid)) {
        const role = guild.roles.cache.get(rid);
        if (role && botMe.roles.highest.comparePositionTo(role) > 0) {
          await member.roles.remove(rid).catch(() => {});
        }
      }
    }

    if (targetRoleId && !member.roles.cache.has(targetRoleId)) {
      const role = guild.roles.cache.get(targetRoleId) ||
        await guild.roles.fetch(targetRoleId).catch(() => null);

      if (role && botMe.roles.highest.comparePositionTo(role) > 0) {
        await member.roles.add(targetRoleId).catch(() => {});
        console.log(`[JUDGE-RANK] ${member.user.tag} → ${targetRank?.label || targetRoleId} (judged:${judged})`);
        return { applied: true, roleId: targetRoleId, label: targetRank?.label, judged };
      }
    }

    return { applied: false, reason: 'no_change', judged };
  } catch (e) {
    console.error('[JUDGE-RANK] error:', e.message);
    return { applied: false, reason: 'error', error: e.message };
  }
}

export async function applyJudgeRankAll(guild) {
  const settings = await getSettings();
  const ranks = settings?.judgeRanks;
  if (!ranks || ranks.length === 0) return;

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  let count = 0;
  for (const m of members.values()) {
    if (m.user.bot) continue;
    const result = await applyJudgeRank(guild, m);
    if (result.applied) count++;
  }

  console.log(`[JUDGE-RANK] bulk done. ${count} members updated.`);
}