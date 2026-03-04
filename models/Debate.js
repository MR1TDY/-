import mongoose from 'mongoose';

const debateSchema = new mongoose.Schema({
  guildId: String,
  channelId: { type: String, index: true },

  topicId: { type: String, index: true },
  topicTitle: String,
  topicColor: { type: String, enum: ['white', 'green', 'yellow', 'red', 'black'] },

  judgeId: String,
  winnerId: String,
  loserId: String,

  performanceScore: { type: Number, min: 0, max: 10 },

  lossReason: String,
  notes: String,

  archiveMessageId: String,

  deleteAt: Date,

  objection: {
    open: { type: Boolean, default: true },
    expiresAt: Date,
    byUserId: String,
    reason: String
  }
}, { timestamps: true });

export default mongoose.model('Debate', debateSchema);
