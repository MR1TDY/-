import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';

import User from '../models/User.js';
import { canEditMonthly, timeUntilMonthly } from '../utils/helpers.js';
import { profileEmbed } from '../utils/embeds.js';
import { isStaff } from '../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Profile system')
    .addSubcommand(sc =>
      sc
        .setName('set')
        .setDescription('Set your profile')
    )
    .addSubcommand(sc =>
      sc
        .setName('view')
        .setDescription('View a profile')
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
        .setDescription('Hide/show your profile')
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
          'profile.hidden': hidden,
          'profile.updatedAt': new Date()
        },
        { upsert: true, new: true }
      );

      return interaction.reply({
        content: hidden ? 'تم إخفاء البروفايل ✅' : 'تم إظهار البروفايل ✅',
        ephemeral: true
      });
    }

    if (sub === 'view') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const staff = isStaff(interaction);

      const doc = await User.findOne({ userId: targetUser.id });
      const hidden = doc?.profile?.hidden === true;

      const viewingSelf = targetUser.id === interaction.user.id;

      if (hidden && !viewingSelf && !staff) {
        return interaction.reply({
          content: 'هذا الشخص قد أخفى معلوماته.',
          ephemeral: true
        });
      }

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const emb = profileEmbed(member || interaction.member, doc?.profile);

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

      const last = doc?.limits?.profileLastSetAt;
      if (!canEditMonthly(last)) {
        return interaction.reply({
          content: `تقدر تعدل بروفايلك بعد ${timeUntilMonthly(last)} (قيد مرة بالشهر).`,
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('profile:set')
        .setTitle('Set Profile');

      const name = new TextInputBuilder().setCustomId('name').setLabel('Name').setStyle(TextInputStyle.Short).setRequired(true);
      const age = new TextInputBuilder().setCustomId('age').setLabel('Age').setStyle(TextInputStyle.Short).setRequired(true);
      const country = new TextInputBuilder().setCustomId('country').setLabel('Country').setStyle(TextInputStyle.Short).setRequired(true);
      const city = new TextInputBuilder().setCustomId('city').setLabel('City/Region').setStyle(TextInputStyle.Short).setRequired(true);
      const team = new TextInputBuilder().setCustomId('team').setLabel('Team').setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(name),
        new ActionRowBuilder().addComponents(age),
        new ActionRowBuilder().addComponents(country),
        new ActionRowBuilder().addComponents(city),
        new ActionRowBuilder().addComponents(team)
      );

      return interaction.showModal(modal);
    }
  }
};