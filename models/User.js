import mongoose from 'mongoose';
 
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },

  discordUsername: { type: String, default: '' },
  guildNickname: { type: String, default: '' },

  registrationNumber: { type: Number, index: true },
  registeredAt: Date,

  guild: {
    joinedAt: Date,
    leftAt: Date
  },

  profile: {
    name: String,
    age: String,
    country: String,
    city: String,
    team: String,
    hidden: { type: Boolean, default: false },
    updatedAt: Date
  },

  tournament: {
    role: String,
    consent: String,
    logicalRating: String,
    previousDebates: String,
    style: String,
    hidden: { type: Boolean, default: false },
    updatedAt: Date
  },

  limits: {
    profileLastSetAt: Date,
    tournamentLastSetAt: Date
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);