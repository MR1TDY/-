import { getSettings } from './settingsService.js';
import Stats from '../models/Stats.js';

export async function applyDebaterRank(guild, member) {
  try {
    const settings = await getSettings();
    const ranks = settings?.debaterRanks;
    if (!ranks || ranks.length === 0) return { applied: false, reason: 'no_ranks' };

    const stats = await Stats.findOne({ userId: member.id });
    const wins = Number(stats?.wins || 0);
    const losses = Number(stats?.losses || 0);

    const sorted = [...ranks].sort((a, b) => (a.winsToPromote || 0) - (b.winsToPromote || 0));

    let bestRank = null;

    for (const rank of sorted) {
      if (!rank.autoPromote) continue;
      if (wins >= (rank.winsToPromote || 0)) {
        bestRank = rank;
      }
    }

    // شيك الهبوط: إذا المستخدم عنده رتبة أعلى من المستحقة
    // وعدد خساراته وصل حد الهبوط، ننزله
    let currentRankIndex = -1;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].roleId && member.roles.cache.has(sorted[i].roleId)) {
        currentRankIndex = i;
        break;
      }
    }

    let targetRank = bestRank;

    // إذا عنده رتبة حالية وعدد خساراته وصل حد الهبوط لهالرتبة
    if (currentRankIndex >= 0) {
      const currentRank = sorted[currentRankIndex];
      const lossLimit = currentRank.lossesToDemote || 0;

      if (lossLimit > 0 && losses >= lossLimit) {
        // ينزل رتبة وحدة
        if (currentRankIndex > 0) {
          targetRank = sorted[currentRankIndex - 1];
        } else {
          targetRank = null; // أدنى رتبة، نشيل كل شيء
        }
      } else if (bestRank) {
        // إذا ما وصل حد الهبوط، نشوف هل يستحق صعود
        const bestIndex = sorted.indexOf(bestRank);
        if (bestIndex > currentRankIndex) {
          targetRank = bestRank; // صعود
        } else {
          targetRank = currentRank; // يبقى مكانه
        }
      } else {
        targetRank = currentRank; // يبقى مكانه
      }
    }

    // جمع كل role IDs حق الرتب
    const allRoleIds = sorted.map(r => r.roleId).filter(Boolean);
    const targetRoleId = targetRank?.roleId || null;

    const botMe = guild.members.me;
    if (!botMe?.permissions.has('ManageRoles')) {
      return { applied: false, reason: 'no_manage_roles' };
    }

    // شيل كل الرتب القديمة
    for (const rid of allRoleIds) {
      if (rid !== targetRoleId && member.roles.cache.has(rid)) {
        const role = guild.roles.cache.get(rid);
        if (role && botMe.roles.highest.comparePositionTo(role) > 0) {
          await member.roles.remove(rid).catch(() => {});
        }
      }
    }

    // أضف الرتبة المستحقة
    if (targetRoleId && !member.roles.cache.has(targetRoleId)) {
      const role = guild.roles.cache.get(targetRoleId) ||
        await guild.roles.fetch(targetRoleId).catch(() => null);

      if (role && botMe.roles.highest.comparePositionTo(role) > 0) {
        await member.roles.add(targetRoleId).catch(() => {});
        console.log(`[DEBATER-RANK] ${member.user.tag} → ${targetRank?.label || targetRoleId} (wins:${wins} losses:${losses})`);
        return { applied: true, roleId: targetRoleId, label: targetRank?.label, wins, losses };
      }
    }

    return { applied: false, reason: 'no_change', wins, losses };
  } catch (e) {
    console.error('[DEBATER-RANK] error:', e.message);
    return { applied: false, reason: 'error', error: e.message };
  }
}

export async function applyDebaterRankAll(guild) {
  const settings = await getSettings();
  const ranks = settings?.debaterRanks;
  if (!ranks || ranks.length === 0) return;

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  let count = 0;
  for (const m of members.values()) {
    if (m.user.bot) continue;
    const result = await applyDebaterRank(guild, m);
    if (result.applied) count++;
  }

  console.log(`[DEBATER-RANK] bulk done. ${count} members updated.`);
}