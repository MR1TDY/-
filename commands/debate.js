import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import Debate from '../models/Debate.js';
import Topic from '../models/Topic.js';

import { isStaff } from '../utils/permissions.js';
import { applyResult } from '../services/statsUpdateService.js';
import { addDebatePoints } from '../services/scoreService.js';
import { winPointsByColor } from '../utils/debatePoints.js';
import { sendDebateArchive } from '../services/archiveService.js';
import { applyScoreRoles } from '../services/autoRoleService.js';

import { getLossRatioByColor } from '../utils/colorLossRatios.js';
import { getMemberDebaterLossBase } from '../services/lossBaseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debate')
    .setDescription('Debate tools')
    .addSubcommand(sc =>
      sc
        .setName('end')
        .setDescription('End a debate (judge only)')
        .addUserOption(o => o.setName('winner').setDescription('Winner').setRequired(true))
        .addUserOption(o => o.setName('loser').setDescription('Loser').setRequired(true))
        .addIntegerOption(o =>
          o
            .setName('performance')
            .setDescription('Performance score 0-10')
            .setMinValue(0)
            .setMaxValue(10)
            .setRequired(true)
        )
        .addStringOption(o => o.setName('reason').setDescription('Loss reason').setRequired(true))
        .addStringOption(o => o.setName('notes').setDescription('Notes').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== 'end') return;

    try {
      if (!isStaff(interaction)) {
        return interaction.reply({ content: 'هذا الأمر للحكام/الإدارة فقط.', ephemeral: true });
      }

      const winner = interaction.options.getUser('winner');
      const loser = interaction.options.getUser('loser');
      const performanceScore = interaction.options.getInteger('performance');
      const reason = interaction.options.getString('reason');
      const notes = interaction.options.getString('notes') || '';

      if (winner.id === loser.id) {
        return interaction.reply({ content: 'الفائز والخاسر لازم يكونون مختلفين.', ephemeral: true });
      }

      const topic = await Topic.findOne({ debateChannelId: interaction.channelId, status: 'matched' });
      if (!topic) {
        return interaction.reply({
          content: 'هذا الروم غير مربوط بتوبيك. تأكد إن الروم تم إنشاؤه عبر /topic.',
          ephemeral: true
        });
      }

      const color = topic.color;
      const topicTitle = topic.title;

      const winPoints = winPointsByColor(color);

      const loserMember = await interaction.guild.members.fetch(loser.id).catch(() => null);

      let lossPoints = 50;
      if (loserMember) {
        const base = await getMemberDebaterLossBase(interaction.guild, loserMember);
        const ratio = getLossRatioByColor(color);
        lossPoints = Math.max(0, Math.round(base * ratio));
      }

      await applyResult({ winnerId: winner.id, loserId: loser.id, performanceScore });

      await addDebatePoints(winner.id, winPoints);
      await addDebatePoints(loser.id, -lossPoints);

      const winnerMember = await interaction.guild.members.fetch(winner.id).catch(() => null);
      if (winnerMember) await applyScoreRoles(interaction.guild, winnerMember, 'debates');

      if (loserMember) await applyScoreRoles(interaction.guild, loserMember, 'debates');

      const archiveEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('Debate Archive')
        .addFields(
          { name: 'التوبيك', value: topicTitle },
          { name: 'اللون', value: String(color).toUpperCase(), inline: true },
          { name: 'الحكم', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'الفائز', value: `<@${winner.id}>`, inline: true },
          { name: 'الخاسر', value: `<@${loser.id}>`, inline: true },
          { name: 'تقييم الأداء', value: `${performanceScore}/10`, inline: true },
          { name: 'سبب الخسارة', value: reason },
          { name: 'ملاحظات', value: notes || '—' }
        )
        .setFooter({ text: `TopicID: ${topic._id}` });

      const archiveMessageId = await sendDebateArchive(interaction.client, { embeds: [archiveEmbed] });

      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const deleteAt = new Date(Date.now() + oneWeek);

      const twoDays = 48 * 60 * 60 * 1000;
      const objectionExpiresAt = new Date(Date.now() + twoDays);

      await Debate.create({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        topicId: String(topic._id),
        topicTitle,
        topicColor: color,
        judgeId: interaction.user.id,
        winnerId: winner.id,
        loserId: loser.id,
        performanceScore,
        lossReason: reason,
        notes,
        archiveMessageId: archiveMessageId || null,
        deleteAt,
        objection: {
          open: true,
          expiresAt: objectionExpiresAt
        }
      });

      topic.status = 'closed';
      await topic.save();

      await interaction.reply({
        content: `تم إنهاء النقاش ✅
الفائز: <@${winner.id}>
الخاسر: <@${loser.id}>
تمت الأرشفة${archiveMessageId ? '' : ' (فشل إرسال الأرشيف)'}.
الاعتراض متاح 48 ساعة لأطراف النقاش فقط.
سيتم حذف الروم بعد أسبوع.`,
        ephemeral: false
      });

      const objectionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`debate:objection:${String(topic._id)}`)
          .setLabel('اعتراض على النتيجة')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.channel.send({
        content: 'إذا عندك اعتراض على النتيجة، اضغط الزر خلال 48 ساعة.',
        components: [objectionRow]
      });

      await interaction.channel.permissionOverwrites
        .edit(interaction.guild.roles.everyone.id, { ViewChannel: false })
        .catch(() => {});

      await interaction.channel.permissionOverwrites.edit(winner.id, { SendMessages: false }).catch(() => {});
      await interaction.channel.permissionOverwrites.edit(loser.id, { SendMessages: false }).catch(() => {});
      await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false }).catch(() => {});
    } catch (e) {
      console.error('[DEBATE END] crash:', e);

      const msg = 'حدث خطأ أثناء إنهاء النقاش: ' + (e?.message || 'unknown');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
      }
    }
  }
};