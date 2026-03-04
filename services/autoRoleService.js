import { getSettings, getScoreSystem } from './settingsService.js';
import Score from '../models/Score.js';

function pickBestRule(rules, value) {
  const sorted = [...(rules || [])].sort((a, b) => (a.threshold || 0) - (b.threshold || 0));
  let best = null;
  for (const r of sorted) {
    if ((value || 0) >= (r.threshold || 0)) best = r;
  }
  return best;
}

export async function applyScoreRoles(guild, member, key) {
  try {
    const settings = await getSettings();
    const system = getScoreSystem(settings, key);

    if (!system) {
      console.log('[AUTOROLE] no system for key:', key);
      return { applied: false, reason: 'no_system' };
    }

    const score = await Score.findOne({ userId: member.id });
    const value = Number(score?.[key] || 0);

    const best = pickBestRule(system.rules, value);
    if (!best?.roleId) {
      console.log('[AUTOROLE] no rule matched', { key, user: member.user.tag, value });
      return { applied: false, reason: 'no_rule' };
    }

    const targetRoleId = String(best.roleId);
    const targetRole =
      guild.roles.cache.get(targetRoleId) ||
      (await guild.roles.fetch(targetRoleId).catch(() => null));

    console.log('[AUTOROLE]', {
      key,
      user: member.user.tag,
      value,
      targetRoleId,
      removePreviousRoles: !!system.removePreviousRoles
    });

    if (!targetRole) {
      console.log('[AUTOROLE] role missing in guild:', targetRoleId);
      return { applied: false, reason: 'role_missing', roleId: targetRoleId };
    }

    if (system.removePreviousRoles) {
      const allRoleIds = (system.rules || []).map(r => r.roleId).filter(Boolean);
      for (const rid of allRoleIds) {
        if (rid !== targetRoleId && member.roles.cache.has(rid)) {
          try {
            await member.roles.remove(rid);
            console.log('[AUTOROLE] removed', rid, 'from', member.user.tag);
          } catch (e) {
            console.log('[AUTOROLE] failed remove', rid, 'from', member.user.tag, e?.message);
          }
        }
      }
    }

    if (!member.roles.cache.has(targetRoleId)) {
      try {
        await member.roles.add(targetRoleId);
        console.log('[AUTOROLE] added', targetRoleId, 'to', member.user.tag);
        return { applied: true, roleId: targetRoleId, value };
      } catch (e) {
        console.log('[AUTOROLE] failed add', targetRoleId, 'to', member.user.tag, e?.message);
        console.log('[AUTOROLE] TIP: تأكد رتبة البوت أعلى من رتبة الجائزة + صلاحية Manage Roles');
        return { applied: false, reason: 'add_failed', error: e?.message, roleId: targetRoleId, value };
      }
    }

    console.log('[AUTOROLE] already has role', targetRoleId, 'user', member.user.tag);
    return { applied: false, reason: 'already_has', roleId: targetRoleId, value };
  } catch (e) {
    console.log('[AUTOROLE] crash:', e?.message);
    return { applied: false, reason: 'crash', error: e?.message };
  }
}