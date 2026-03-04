import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },

  reporters: { type: Number, default: 0 },
  suggestions: { type: Number, default: 0 },
  invites: { type: Number, default: 0 },

  debates: { type: Number, default: 0 },
  judges: { type: Number, default: 0 },
  integrity: { type: Number, default: 0 },

  donations: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Score', scoreSchema);