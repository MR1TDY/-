import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isStaff } from '../utils/permissions.js';
import { getOrCreateStats, topBy } from '../services/statsService.js';
import { statusEmbed } from '../utils/statusEmbed.js';

const metricLabels = {
  wins: 'الانتصارات',
  debates: 'عدد النقاشات',
  losses: 'الخسائر',
  judgeCount: 'عدد التحكيم',
  maxStreak: 'أعلى سلسلة'
};

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('User status & leaderboard')
    .addSubcommand(sc =>
      sc
        .setName('view')
        .setDescription('View status')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to view').setRequired(false)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName('top')
        .setDescription('Top 10 leaderboard')
        .addStringOption(opt =>
          opt
            .setName('metric')
            .setDescription('wins, debates, judgeCount, maxStreak...')
            .setRequired(false)
            .addChoices(
              { name: 'Wins', value: 'wins' },
              { name: 'Debates', value: 'debates' },
              { name: 'Losses', value: 'losses' },
              { name: 'Judge Count', value: 'judgeCount' },
              { name: 'Max Streak', value: 'maxStreak' }
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
        return interaction.reply({
          content: 'هذا الأمر لعرض حالتك فقط. (الستاف يقدرون يشوفون الآخرين)',
          ephemeral: true
        });
      }

      const doc = await getOrCreateStats(target.id);
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      const emb = statusEmbed(member || interaction.member, doc);

      return interaction.reply({ embeds: [emb], ephemeral: true });
    }

    if (sub === 'top') {
      const metric = interaction.options.getString('metric') || 'wins';
      const rows = await topBy(metric, 10);

      if (!rows.length) {
        return interaction.reply({ content: 'لا يوجد بيانات بعد.', ephemeral: true });
      }

      const lines = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const user = await interaction.client.users.fetch(r.userId).catch(() => null);
        const member = await interaction.guild.members.fetch(r.userId).catch(() => null);
        const name = member?.displayName || user?.username || r.userId;
        const value = r?.[metric] ?? 0;

        lines.push(
          `**#${i + 1}**
` +
          `الاسم: **${name}**
` +
          `القيمة: **${value}**
`
        );
      }

      const emb = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`أفضل 10 - ${metricLabels[metric] || metric}`)
        .setDescription(lines.join(''))
        .setTimestamp();

      return interaction.reply({
        embeds: [emb],
        ephemeral: false
      });
    }
  }
};