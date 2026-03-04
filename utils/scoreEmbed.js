import { EmbedBuilder } from 'discord.js';

export function scoreEmbed(member, scoreDoc) {
  const s = scoreDoc || {};
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('Score')
    .setThumbnail(member.displayAvatarURL())
    .addFields(
      { name: 'مبلغين', value: String(s.reporters ?? 0), inline: true },
      { name: 'الاقتراحات', value: String(s.suggestions ?? 0), inline: true },
      { name: 'الدعوات', value: String(s.invites ?? 0), inline: true },

      { name: 'النقاشات', value: String(s.debates ?? 0), inline: true },
      { name: 'الحكام', value: String(s.judges ?? 0), inline: true },
      { name: 'نزاه', value: String(s.integrity ?? 0), inline: true },

      { name: 'التبرع', value: String(s.donations ?? 0), inline: true }
    )
    .setFooter({ text: 'Anime Debate System' });
}
