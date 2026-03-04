import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  inviterId: String,
  uses: Number
});

export default mongoose.model('Invite', inviteSchema);
