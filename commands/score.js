import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../utils/permissions.js';
import { getOrCreateScore } from '../services/scoreService.js';
import { scoreEmbed } from '../utils/scoreEmbed.js';
import Score from '../models/Score.js';

const fieldLabels = {
  debates: 'النقاشات',
  invites: 'الدعوات',
  reporters: 'المبلغين',
  suggestions: 'الاقتراحات',
  judges: 'الحكام',
  integrity: 'النزاهة',
  donations: 'التبرعات'
};

export default {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Score & leaderboard')
    .addSubcommand(sc =>
      sc
        .setName('view')
        .setDescription('View score')
        .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(false))
    )
    .addSubcommand(sc =>
      sc
        .setName('top')
        .setDescription('Top 10 by score field')
        .addStringOption(opt =>
          opt
            .setName('field')
            .setDescription('Which field?')
            .setRequired(true)
            .addChoices(
              { name: 'النقاشات', value: 'debates' },
              { name: 'الدعوات', value: 'invites' },
              { name: 'مبلغين', value: 'reporters' },
              { name: 'الاقتراحات', value: 'suggestions' },
              { name: 'الحكام', value: 'judges' },
              { name: 'نزاه', value: 'integrity' },
              { name: 'التبرع', value: 'donations' }
            )
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const target = interaction.options.getUser('user') || interaction.user;

      const staff = isStaff(interaction);
      const self = target.id === interaction.user.id;

      if (!self && !staff) {
        return interaction.reply({ content: 'هذا الأمر لعرض نقاطك فقط. (الستاف يقدرون يشوفون الآخرين)', ephemeral: true });
      }

      const doc = await getOrCreateScore(target.id);
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      const emb = scoreEmbed(member || interaction.member, doc);

      return interaction.reply({ embeds: [emb], ephemeral: true });
    }

    if (sub === 'top') {
  const field = interaction.options.getString('field');

  const rows = await Score.find().sort({ [field]: -1 }).limit(10);
  if (!rows.length) {
    return interaction.reply({ content: 'لا يوجد بيانات بعد.', ephemeral: true });
  }

  const lines = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const user = await interaction.client.users.fetch(r.userId).catch(() => null);
    const member = await interaction.guild.members.fetch(r.userId).catch(() => null);

    const name = member?.displayName || user?.username || r.userId;
    const points = Number(r[field] ?? 0);

    lines.push(
      `**#${i + 1}**
` +
      `الاسم: **${name}**
` +
      `النقاط: **${points}**
`
    );
  }

  const emb = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`أفضل 10 - ${fieldLabels[field] || field}`)
    .setDescription(lines.join(''))
    .setTimestamp();

      return interaction.reply({
        embeds: [emb],
        ephemeral: false
      });
    }
  }
};