import mongoose from 'mongoose';
import crypto from 'crypto';

const topicSchema = new mongoose.Schema({
  topicId: {
    type: String,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },

  guildId: { type: String, index: true },

  creatorId: { type: String, index: true },
  creatorTag: String,

  title: String,
  category: String,
  debateType: String,
  thesisShort: String,
  thesisFull: String,

  status: {
    type: String,
    enum: ['pending', 'rejected', 'published', 'matched', 'closed'],
    default: 'pending',
    index: true
  },

  color: { type: String, enum: ['white', 'green', 'yellow', 'red', 'black', null], default: null },

  approvedById: String,
  approvedAt: Date,
  rejectedById: String,
  rejectedAt: Date,
  rejectReason: String,

  publishMessageId: String,
  approvalMessageId: String,

  opposerId: String,
  judgeId: String,

  debateChannelId: String,

  expiresAt: { type: Date, index: true }
}, { timestamps: true });

export default mongoose.model('Topic', topicSchema);