import config from '../config.js';
import { getSettings, getScoreSystem } from './settingsService.js';
import Score from '../models/Score.js';
import { applyDebaterRankAll } from './debaterRankService.js';
import { applyJudgeRankAll } from './judgeRankService.js';

function pickBestRule(rules, value) {
  const sorted = [...(rules || [])].sort((a, b) => (a.threshold || 0) - (b.threshold || 0));
  let best = null;
  for (const r of sorted) {
    if ((value || 0) >= (r.threshold || 0)) best = r;
  }
  return best;
}

async function applyOneSystem({ guild, member, key, system }) {
  const score = await Score.findOne({ userId: member.id });
  const value = Number(score?.[key] || 0);

  const best = pickBestRule(system.rules, value);
  if (!best?.roleId) return;

  const targetRoleId = String(best.roleId);
  const botMe = guild.members.me;

  const targetRole = guild.roles.cache.get(targetRoleId) || await guild.roles.fetch(targetRoleId).catch(() => null);
  if (!targetRole) return;

  if (!botMe?.permissions.has('ManageRoles')) return;
  if (botMe.roles.highest.comparePositionTo(targetRole) <= 0) return;

  if (system.removePreviousRoles) {
    const allRoleIds = (system.rules || []).map(r => r.roleId).filter(Boolean).map(String);
    for (const rid of allRoleIds) {
      if (rid !== targetRoleId && member.roles.cache.has(rid)) {
        await member.roles.remove(rid).catch(() => {});
      }
    }
  }

  if (!member.roles.cache.has(targetRoleId)) {
    await member.roles.add(targetRoleId).catch(() => {});
  }
}

async function runScoreRanks(guild) {
  const settings = await getSettings();
  const systems = settings?.scoreRankSystems || [];
  if (!systems.length) return;

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  for (const m of members.values()) {
    if (m.user.bot) continue;

    for (const sys of systems) {
      const key = String(sys.key || '').trim();
      if (!key) continue;

      const system = getScoreSystem(settings, key);
      if (!system) continue;

      await applyOneSystem({ guild, member: m, key, system });
    }
  }

  console.log('[SCORE-RANKS] applied to all members');
}

export async function runAutoRankOnce(client) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    console.log('[AUTO-RANK] guild not found:', config.guildId);
    return;
  }

  console.log('[AUTO-RANK] starting full check...');

  // 1. رتب السكور
  await runScoreRanks(guild).catch(e => console.error('[SCORE-RANKS] error:', e.message));

  // 2. رتب المناقشين
  await applyDebaterRankAll(guild).catch(e => console.error('[DEBATER-RANK-ALL] error:', e.message));

  // 3. رتب الحكام
  await applyJudgeRankAll(guild).catch(e => console.error('[JUDGE-RANK-ALL] error:', e.message));

  console.log('[AUTO-RANK] full check done ✅');
}

export function startAutoRankScheduler(client, minutes = 10) {
  // أول تشغيل فوري
  runAutoRankOnce(client).catch(e => console.error('[AUTO-RANK] initial run error:', e.message));

  // ثم كل X دقيقة
  setInterval(() => {
    runAutoRankOnce(client).catch(e => console.error('[AUTO-RANK] scheduled run error:', e.message));
  }, minutes * 60 * 1000);

  console.log(`[AUTO-RANK] scheduler started, runs every ${minutes} minutes`);
}