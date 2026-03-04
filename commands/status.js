import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../utils/permissions.js';
import { getOrCreateStats, topBy } from '../services/statsService.js';
import { statusEmbed } from '../utils/statusEmbed.js';

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
        return interaction.reply({ content: 'هذا الأمر لعرض حالتك فقط. (الستاف يقدرون يشوفون الآخرين)', ephemeral: true });
      }

      const doc = await getOrCreateStats(target.id);
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      const emb = statusEmbed(member || interaction.member, doc);

      if (self) return interaction.reply({ embeds: [emb], ephemeral: true });
      return interaction.reply({ embeds: [emb], ephemeral: true });
    }

    if (sub === 'top') {
      const metric = interaction.options.getString('metric') || 'wins';
      const rows = await topBy(metric, 10);

      if (!rows.length) return interaction.reply({ content: 'لا يوجد بيانات بعد.', ephemeral: true });

      const lines = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const user = await interaction.client.users.fetch(r.userId).catch(() => null);
        const name = user?.username || r.userId;
        lines.push(`${i + 1}) ${name} — ${r[metric] ?? 0}`);
      }

      return interaction.reply({
        content: `Top 10 (${metric})
` + lines.join(''),
        ephemeral: false
      });
    }
  }
};