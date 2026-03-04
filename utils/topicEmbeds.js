import { EmbedBuilder } from 'discord.js';

export function topicEmbed(topic, extraTitle = 'Topic') {
  const colorMap = {
    white: 0xffffff,
    green: 0x2ecc71,
    yellow: 0xf1c40f,
    red: 0xe74c3c,
    black: 0x2c2c2c
  };

  const emb = new EmbedBuilder()
    .setColor(colorMap[topic.color] ?? 0x95a5a6)
    .setTitle(extraTitle)
    .addFields(
      { name: 'العنوان', value: topic.title || '—' },
      { name: 'التصنيف', value: topic.category || '—', inline: true },
      { name: 'نوع النقاش', value: topic.debateType || '—', inline: true },
      { name: 'الأطروحة (مختصر)', value: topic.thesisShort || '—' },
      { name: 'الأطروحة (تفصيل)', value: topic.thesisFull || '—' }
    )
    .setFooter({ text: `Creator: ${topic.creatorTag || topic.creatorId}` });

  if (topic.color) emb.addFields({ name: 'اللون', value: topic.color.toUpperCase(), inline: true });
  if (topic.status) emb.addFields({ name: 'الحالة', value: topic.status, inline: true });

  return emb;
}