import config from '../config.js';
import { getOrCreateScore } from './scoreService.js';
import { applyScoreRoles } from './autoRoleService.js';

export async function addInvitePoints(guild, userId, amount = 1) {
  const points = Number(config.invitePointsPerJoin || 1) * amount;

  const doc = await getOrCreateScore(userId);
  doc.invites = (doc.invites || 0) + points;
  await doc.save();

  const member = await guild.members.fetch(userId).catch(() => null);
  if (member) await applyScoreRoles(guild, member, 'invites');

  return doc;
}