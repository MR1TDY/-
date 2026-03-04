import Invite from '../models/Invite.js';
import { sendLog } from './logSystem.js';
import { addInvitePoints } from '../services/invitePointsService.js';
import config from '../config.js';

export async function initInviteCache(client) {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return;

  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;

  invites.forEach(inv => {
    client.inviteCache.set(inv.code, inv.uses ?? 0);
  });

  await sendLog(client, `Invite cache loaded: ${invites.size} invites`);
}

export async function handleMemberJoin(member, client) {
  const invites = await member.guild.invites.fetch().catch(() => null);
  if (!invites) return;

  let usedInvite = null;

  invites.forEach(inv => {
    const prevUses = client.inviteCache.get(inv.code) || 0;
    if ((inv.uses ?? 0) > prevUses) usedInvite = inv;
    client.inviteCache.set(inv.code, inv.uses ?? 0);
  });

  if (!usedInvite) return;

  const inviterId = usedInvite.inviter?.id;
  if (!inviterId) return;

  await Invite.findOneAndUpdate(
    { code: usedInvite.code },
    { code: usedInvite.code, inviterId, uses: usedInvite.uses ?? 0 },
    { upsert: true, new: true }
  );

  await addInvitePoints(member.guild, inviterId, 1);

  await sendLog(client, `Member ${member.user.tag} joined using invite ${usedInvite.code} by <@${inviterId}>`);
}