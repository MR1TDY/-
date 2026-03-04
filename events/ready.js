import { ActivityType } from 'discord.js';
import { initInviteCache } from '../systems/inviteTracker.js';
import Topic from '../models/Topic.js';
import Debate from '../models/Debate.js';
import { sendLog } from '../systems/logSystem.js';
import User from '../models/User.js';
import config from '../config.js';
import { startAutoRankScheduler } from '../services/autoRankScheduler.js';



export default {
  name: 'ready',
  once: true,
  async execute(client) {
    const guild = client.guilds.cache.get(config.guildId);
    startAutoRankScheduler(client, 10);
    if (guild) {
  const members = await guild.members.fetch().catch(() => null);
  if (members) {
    for (const m of members.values()) {
      if (m.user.bot) continue;
      await User.findOneAndUpdate(
        { userId: m.user.id },
        {
          userId: m.user.id,
          discordUsername: m.user.username,
          guildNickname: m.nickname || '',
          'guild.joinedAt': m.joinedAt || null
        },
        { upsert: true }
      );
    }
    console.log('✅ Synced guild members into User collection');
  }
}
    client.user.setActivity('Debates & Tier System', { type: ActivityType.Watching });

    await initInviteCache(client);

    setInterval(async () => {
      try {
        const now = new Date();
        const expired = await Topic.find({
          status: { $in: ['pending', 'published'] },
          expiresAt: { $lte: now }
        });

        for (const t of expired) {
          t.status = 'closed';
          await t.save();
          await sendLog(client, `Topic closed by expiry ${t._id}`);
        }
      } catch (e) {
        console.error('Topic expiry job error:', e);
      }
    }, 60 * 1000);

    setInterval(async () => {
      try {
        const now = new Date();
        const due = await Debate.find({ deleteAt: { $lte: now } }).limit(10);

        for (const d of due) {
          const guild = client.guilds.cache.get(d.guildId);
          if (!guild) {
            await Debate.deleteOne({ _id: d._id });
            continue;
          }

          const ch = await guild.channels.fetch(d.channelId).catch(() => null);
          if (ch) await ch.delete('Debate expired cleanup').catch(() => {});

          await Debate.deleteOne({ _id: d._id });
          await sendLog(client, `Debate channel deleted ${d.channelId}`);
        }
      } catch (e) {
        console.error('Debate delete job error:', e);
      }
    }, 60 * 1000);
  }
};