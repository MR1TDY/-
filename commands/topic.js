import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';

import config from '../config.js';
import { userHasActiveTopic, createTopic, setApprovalMessage } from '../services/topicService.js';
import { topicEmbed } from '../utils/topicEmbeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Create a debate topic'),

  async execute(interaction) {
    const hasActive = await userHasActiveTopic(interaction.guildId, interaction.user.id);
    if (hasActive) {
      return interaction.reply({ content: 'عندك توبيك نشط بالفعل. لازم يخلص قبل ما تنشئ واحد جديد.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('topic:create')
      .setTitle('Create Topic');

    const title = new TextInputBuilder().setCustomId('title').setLabel('عنوان').setStyle(TextInputStyle.Short).setRequired(true);
    const category = new TextInputBuilder().setCustomId('category').setLabel('تصنيف الموضوع').setStyle(TextInputStyle.Short).setRequired(true);
    const debateType = new TextInputBuilder().setCustomId('debateType').setLabel('نوع النقاش').setStyle(TextInputStyle.Short).setRequired(true);
    const thesisShort = new TextInputBuilder().setCustomId('thesisShort').setLabel('صياغة الأطروحة (مختصر)').setStyle(TextInputStyle.Short).setRequired(true);
    const thesisFull = new TextInputBuilder().setCustomId('thesisFull').setLabel('صياغة مفصل').setStyle(TextInputStyle.Paragraph).setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(title),
      new ActionRowBuilder().addComponents(category),
      new ActionRowBuilder().addComponents(debateType),
      new ActionRowBuilder().addComponents(thesisShort),
      new ActionRowBuilder().addComponents(thesisFull)
    );

    return interaction.showModal(modal);
  }
};