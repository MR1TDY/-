import { checkMessageModeration, applyThreeStrikesLoss } from '../services/moderationService.js';

export default {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    const res = await checkMessageModeration(message);
    if (!res) return;

    const { nextCount, trigger, topic } = res;

    await message.reply(`يرجى عدم قول (${trigger}) لأنها قد تتسبب في طردك. تحذير: ${nextCount}/3`).catch(() => {});

    if (nextCount >= 3) {
      await applyThreeStrikesLoss({
        guild: message.guild,
        channel: message.channel,
        userId: message.author.id,
        topic
      });
    }
  }
};