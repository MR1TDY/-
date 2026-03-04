import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';

import User from '../models/User.js';
import { canEditMonthly, timeUntilMonthly } from '../utils/helpers.js';
import { tournamentEmbed } from '../utils/embeds.js';
import { isStaff } from '../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Tournament form')
    .addSubcommand(sc =>
      sc
        .setName('set')
        .setDescription('Set your tournament info')
    )
    .addSubcommand(sc =>
      sc
        .setName('view')
        .setDescription('View tournament info')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('User to view')
            .setRequired(false)
        )
    )
    .addSubcommand(sc =>
      sc
        .setName('privacy')
        .setDescription('Hide/show your tournament info')
        .addBooleanOption(opt =>
          opt
            .setName('hidden')
            .setDescription('true = hide, false = show')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'privacy') {
      const hidden = interaction.options.getBoolean('hidden');

      await User.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          userId: interaction.user.id,
          username: interaction.user.username,
          'tournament.hidden': hidden,
          'tournament.updatedAt': new Date()
        },
        { upsert: true, new: true }
      );

      return interaction.reply({
        content: hidden ? 'تم إخفاء بيانات البطولة ✅' : 'تم إظهار بيانات البطولة ✅',
        ephemeral: true
      });
    }

    if (sub === 'view') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const staff = isStaff(interaction);

      const doc = await User.findOne({ userId: targetUser.id });
      const hidden = doc?.tournament?.hidden === true;

      const viewingSelf = targetUser.id === interaction.user.id;

      if (hidden && !viewingSelf && !staff) {
        return interaction.reply({
          content: 'هذا الشخص قد أخفى معلوماته.',
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const emb = tournamentEmbed(member || interaction.member, doc?.tournament);

      if (viewingSelf) {
        return interaction.reply({ embeds: [emb], ephemeral: true });
      }

      if (hidden && staff) {
        return interaction.reply({ embeds: [emb], ephemeral: true });
      }

      return interaction.reply({ embeds: [emb], ephemeral: false });
    }

    if (sub === 'set') {
      const doc = await User.findOne({ userId: interaction.user.id });

      const last = doc?.limits?.tournamentLastSetAt;
      if (!canEditMonthly(last)) {
        return interaction.reply({
          content: `تقدر تعدل بيانات البطولة بعد ${timeUntilMonthly(last)} (قيد مرة بالشهر).`,
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('tournament:set')
        .setTitle('Tournament Form');

      const role = new TextInputBuilder().setCustomId('role').setLabel('Your role in tournament').setStyle(TextInputStyle.Short).setRequired(true);
      const consent = new TextInputBuilder().setCustomId('consent').setLabel('Do you agree to register and be evaluated?').setStyle(TextInputStyle.Short).setRequired(true);
      const logicalRating = new TextInputBuilder().setCustomId('logicalRating').setLabel('Rate your logical debating').setStyle(TextInputStyle.Short).setRequired(true);
      const previousDebates = new TextInputBuilder().setCustomId('previousDebates').setLabel('Have you debated before?').setStyle(TextInputStyle.Short).setRequired(true);
      const style = new TextInputBuilder().setCustomId('style').setLabel('Describe your debate style').setStyle(TextInputStyle.Paragraph).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(role),
        new ActionRowBuilder().addComponents(consent),
        new ActionRowBuilder().addComponents(logicalRating),
        new ActionRowBuilder().addComponents(previousDebates),
        new ActionRowBuilder().addComponents(style)
      );

      return interaction.showModal(modal);
    }
  }
};