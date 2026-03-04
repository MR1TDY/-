
import mongoose from 'mongoose';

const debaterRankSchema = new mongoose.Schema(
  {
    level: { type: Number, default: 0 },
    label: { type: String, default: '' },
    roleId: { type: String, default: '' },
    winsToPromote: { type: Number, default: 0 },
    lossesToDemote: { type: Number, default: 0 },
    lossDeductionBase: { type: Number, default: 0 },
    autoPromote: { type: Boolean, default: true }
  },
  { _id: false }
);

const judgeRankSchema = new mongoose.Schema(
  {
    level: { type: Number, default: 0 },
    label: { type: String, default: '' },
    roleId: { type: String, default: '' },
    judgedToPromote: { type: Number, default: 0 },
    errorsToDemote: { type: Number, default: 0 },
    demotionDeductionBase: { type: Number, default: 0 },
    autoPromote: { type: Boolean, default: true }
  },
  { _id: false }
);

const scoreRankRuleSchema = new mongoose.Schema(
  {
    threshold: Number,
    roleId: String,
    label: String
  },
  { _id: false }
);

const scoreRankSystemSchema = new mongoose.Schema(
  {
    key: String,
    name: String,
    removePreviousRoles: { type: Boolean, default: true },
    rules: { type: [scoreRankRuleSchema], default: [] }
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema({
  approvalChannel: String,
  publishChannel: String,
  debateCategory: String,
  archiveChannel: String,
  logChannel: String,
  judgeRoles: [String],
  debaterRoles: [String],
  inviteRewardPoints: Number,
  moderationEnabled: { type: Boolean, default: true },
  badWords: { type: [String], default: [] },

  staffRoleId: { type: String, default: '' },
  judgeRoleId: { type: String, default: '' },
  debaterRoleId: { type: String, default: '' },

  topicApprovalChannelId: { type: String, default: '' },
  topicPublishChannelId: { type: String, default: '' },
  debateCategoryId: { type: String, default: '' },
  objectionsChannelId: { type: String, default: '' },

  scoreRankSystems: { type: [scoreRankSystemSchema], default: [] },

  debaterRanks: { type: [debaterRankSchema], default: [] },
  judgeRanks: { type: [judgeRankSchema], default: [] }
});

export default mongoose.model('Settings', settingsSchema);