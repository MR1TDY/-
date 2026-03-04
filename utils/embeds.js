import { EmbedBuilder } from 'discord.js';

export function profileEmbed(member, data) {
  return new EmbedBuilder()
    .setColor(0x8e44ad)
    .setTitle('Profile')
    .setThumbnail(member.displayAvatarURL())
    .addFields(
      { name: 'Name', value: data?.name || '—', inline: true },
      { name: 'Age', value: data?.age || '—', inline: true },
      { name: 'Country', value: data?.country || '—', inline: true },
      { name: 'City/Region', value: data?.city || '—', inline: true },
      { name: 'Team', value: data?.team || '—', inline: true }
    )
    .setFooter({ text: 'Anime Debate System' });
}

export function tournamentEmbed(member, data) {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('Tournament')
    .setThumbnail(member.displayAvatarURL())
    .addFields(
      { name: 'Your role', value: data?.role || '—' },
      { name: 'Consent', value: data?.consent || '—' },
      { name: 'Logical debate rating', value: data?.logicalRating || '—' },
      { name: 'Previous debates?', value: data?.previousDebates || '—' },
      { name: 'Debate style', value: data?.style || '—' }
    )
    .setFooter({ text: 'Anime Debate System' });
}