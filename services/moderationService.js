import Settings from '../models/Settings.js';
import ModerationCase from '../models/ModerationCase.js';
import Topic from '../models/Topic.js';
import { addDebatePoints } from './scoreService.js';
import Stats from '../models/Stats.js';

async function getSettings() {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
}

export async function checkMessageModeration(message) {
  if (!message.guild || message.author.bot) return null;

  const topic = await Topic.findOne({ debateChannelId: message.channelId, status: { $in: ['matched', 'closed'] } });
  if (!topic) return null;

  const settings = await getSettings();
  if (settings.moderationEnabled === false) return null;

  const badWords = settings.badWords || [];
  if (!badWords.length) return null;

  const content = message.content.toLowerCase();
  const hit = badWords.find(w => w && content.includes(String(w).toLowerCase()));
  if (!hit) return null;

  const prev = await ModerationCase.findOne({ guildId: message.guildId, channelId: message.channelId, userId: message.author.id })
    .sort({ createdAt: -1 });

  const nextCount = (prev?.countInChannel || 0) + 1;

  const row = await ModerationCase.create({
    guildId: message.guildId,
    channelId: message.channelId,
    userId: message.author.id,
    type: 'badword',
    trigger: hit,
    countInChannel: nextCount
  });

  return { row, nextCount, trigger: hit, topic };
}

export async function applyThreeStrikesLoss({ guild, channel, userId, topic }) {
  await Stats.findOneAndUpdate(
    { userId },
    { $inc: { debates: 1, losses: 1 }, $set: { currentStreak: 0 } },
    { upsert: true, new: true }
  );

  await channel.send(`تم إغلاق النقاش بسبب 3 مخالفات. تم تسجيل خسارة وخصم نقاط على <@${userId}>`);

  await channel.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false }).catch(() => {});
  await channel.permissionOverwrites.edit(userId, { SendMessages: false }).catch(() => {});

  topic.status = 'closed';
  await topic.save();
}