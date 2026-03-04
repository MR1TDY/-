import mongoose from 'mongoose';

const moderationCaseSchema = new mongoose.Schema({
  guildId: String,
  channelId: { type: String, index: true },

  userId: { type: String, index: true },

  type: { type: String, enum: ['badword', 'fallacy'], default: 'badword' },
  trigger: String,

  countInChannel: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ModerationCase', moderationCaseSchema);
