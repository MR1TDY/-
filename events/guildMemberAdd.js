import User from '../models/User.js';
import { handleMemberJoin } from '../systems/inviteTracker.js';

export default {
  name: 'guildMemberAdd',
  once: false,
  async execute(member, client) {
    await User.findOneAndUpdate(
      { userId: member.user.id },
      {
        userId: member.user.id,
        discordUsername: member.user.username,
        guildNickname: member.nickname || '',
        'guild.joinedAt': member.joinedAt || new Date(),
        $unset: { 'guild.leftAt': '' }
      },
      { upsert: true, new: true }
    );

    await handleMemberJoin(member, client);
  }
};