import mongoose from 'mongoose';

const badWordsGroupSchema = new mongoose.Schema({
  guildId: { type: String, index: true },
  label: { type: String, default: '' },
  integrityPenalty: { type: Number, default: 0 },
  words: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model('BadWordsGroup', badWordsGroupSchema);