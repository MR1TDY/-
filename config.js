import dotenv from 'dotenv';
dotenv.config();

export default {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoURI: process.env.MONGO_URI,

  ownerId: process.env.BOT_OWNER_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,

  staffRoleIds: (process.env.STAFF_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),

  topicApprovalChannelId: process.env.CHANNEL_TOPIC_APPROVAL_ID,
  topicPublishChannelId: process.env.CHANNEL_TOPIC_PUBLISH_ID,
  debateCategoryId: process.env.CATEGORY_DEBATE_ID,
  debateArchiveChannelId: process.env.CHANNEL_DEBATE_ARCHIVE_ID,
  objectionsChannelId: process.env.CHANNEL_OBJECTIONS_ID,

  judgeRoleIds: (process.env.ROLE_JUDGE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  debaterRoleIds: (process.env.ROLE_DEBATER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),

  invitePointsPerJoin: process.env.INVITE_POINTS_PER_JOIN || '1'
};
