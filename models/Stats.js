import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },

  debates: { type: Number, default: 0 },

  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },

  eliminations: { type: Number, default: 0 },
  withdrawals: { type: Number, default: 0 },

  judgeCount: { type: Number, default: 0 },

  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },

  acceptedObjections: { type: Number, default: 0 },
  rejectedObjections: { type: Number, default: 0 },

  weeklyParticipation: { type: Number, default: 0 },

  performanceTotal: { type: Number, default: 0 },
  performanceCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Stats', statsSchema);
