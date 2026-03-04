import Topic from '../models/Topic.js';

export async function userHasActiveTopic(guildId, userId) {
  const active = await Topic.findOne({
    guildId,
    creatorId: userId,
    status: { $in: ['pending', 'published', 'matched'] }
  });
  return !!active;
}

export async function createTopic(payload) {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Topic.create({
    ...payload,
    expiresAt: new Date(Date.now() + oneWeek)
  });
}

export async function setApprovalMessage(topicId, messageId) {
  return Topic.findByIdAndUpdate(topicId, { approvalMessageId: messageId }, { new: true });
}

export async function setPublishMessage(topicId, messageId) {
  return Topic.findByIdAndUpdate(topicId, { publishMessageId: messageId }, { new: true });
}
