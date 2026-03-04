import User from '../models/User.js';

export default {
  name: 'guildMemberRemove',
  once: false,
  async execute(member) {
    await User.findOneAndUpdate(
      { userId: member.user.id },
      { 'guild.leftAt': new Date() },
      { upsert: true, new: true }
    );
  }
};