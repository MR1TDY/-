import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Debate from '../models/Debate.js';

import config from '../config.js';
import { isStaff } from '../utils/permissions.js';
import { isJudgeMember, isDebaterMember } from '../utils/topicPerms.js';

import { topicEmbed } from '../utils/topicEmbeds.js';
import { createTopic, setApprovalMessage, setPublishMessage } from '../services/topicService.js';
import { sendLog } from '../systems/logSystem.js';
import { nextRegistrationNumber } from '../services/registrationService.js';

import {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

async function ensureRegistration(interaction) {
  const existing = await User.findOne({ userId: interaction.user.id });

  let regNum = existing?.registrationNumber;
  let regAt = existing?.registeredAt;

  if (!regNum) {
    regNum = await nextRegistrationNumber();
    regAt = new Date();
  }

  const joinedAt = interaction.member?.joinedAt || existing?.guild?.joinedAt || null;
  const nickname = interaction.member?.nickname || existing?.guildNickname || '';

  return { existing, regNum, regAt, joinedAt, nickname };
}

async function tryCreateDebateRoom({ client, guild, topic }) {
  if (!topic) return null;
  if (topic.status !== 'published') return null;
  if (!topic.opposerId || !topic.judgeId) return null;
  if (topic.debateChannelId) return null;

  const category = await guild.channels.fetch(config.debateCategoryId).catch(() => null);
  if (!category) throw new Error('CATEGORY_DEBATE_ID is invalid or missing');

  const channel = await guild.channels.create({
    name: `debate-${topic._id.toString().slice(-6)}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: topic.creatorId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      { id: topic.opposerId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      { id: topic.judgeId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] }
    ]
  });

  topic.status = 'matched';
  topic.debateChannelId = channel.id;
  await topic.save();

  await channel.send({
    content: `تم إنشاء روم النقاش ✅
المنشئ: <@${topic.creatorId}>
المعارض: <@${topic.opposerId}>
الحكم: <@${topic.judgeId}>`,
    embeds: [topicEmbed(topic, 'Debate Room Topic')]
  });

  await sendLog(client, `Debate room created topic=${topic._id} channel=${channel.id}`);
  return channel;
}

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction, client);
      }

      if (interaction.isModalSubmit()) {
        const customId = interaction.customId;

        if (customId === 'profile:set') {
          const payload = {
            name: interaction.fields.getTextInputValue('name'),
            age: interaction.fields.getTextInputValue('age'),
            country: interaction.fields.getTextInputValue('country'),
            city: interaction.fields.getTextInputValue('city'),
            team: interaction.fields.getTextInputValue('team'),
            updatedAt: new Date()
          };

          const { regNum, regAt, joinedAt, nickname } = await ensureRegistration(interaction);

          await User.findOneAndUpdate(
            { userId: interaction.user.id },
            {
              userId: interaction.user.id,
              discordUsername: interaction.user.username,
              guildNickname: nickname,

              registrationNumber: regNum,
              registeredAt: regAt,
              'guild.joinedAt': joinedAt,

              profile: payload,
              'limits.profileLastSetAt': new Date()
            },
            { upsert: true, new: true }
          );

          return interaction.reply({ content: 'تم حفظ البروفايل ✅', ephemeral: true });
        }

        if (customId === 'tournament:set') {
          const payload = {
            role: interaction.fields.getTextInputValue('role'),
            consent: interaction.fields.getTextInputValue('consent'),
            logicalRating: interaction.fields.getTextInputValue('logicalRating'),
            previousDebates: interaction.fields.getTextInputValue('previousDebates'),
            style: interaction.fields.getTextInputValue('style'),
            updatedAt: new Date()
          };

          const { regNum, regAt, joinedAt, nickname } = await ensureRegistration(interaction);

          await User.findOneAndUpdate(
            { userId: interaction.user.id },
            {
              userId: interaction.user.id,
              discordUsername: interaction.user.username,
              guildNickname: nickname,

              registrationNumber: regNum,
              registeredAt: regAt,
              'guild.joinedAt': joinedAt,

              tournament: payload,
              'limits.tournamentLastSetAt': new Date()
            },
            { upsert: true, new: true }
          );

          return interaction.reply({ content: 'تم حفظ بيانات البطولة ✅', ephemeral: true });
        }

        if (customId === 'topic:create') {
          const topic = await createTopic({
            guildId: interaction.guildId,
            creatorId: interaction.user.id,
            creatorTag: interaction.user.tag,
            title: interaction.fields.getTextInputValue('title'),
            category: interaction.fields.getTextInputValue('category'),
            debateType: interaction.fields.getTextInputValue('debateType'),
            thesisShort: interaction.fields.getTextInputValue('thesisShort'),
            thesisFull: interaction.fields.getTextInputValue('thesisFull'),
            status: 'pending'
          });

          const approvalChannel = await client.channels.fetch(config.topicApprovalChannelId).catch(() => null);
          if (!approvalChannel) {
            await Topic.findByIdAndUpdate(topic._id, { status: 'closed' });
            return interaction.reply({ content: 'روم الموافقة غير مضبوط. راجع .env', ephemeral: true });
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`topic:approve:white:${topic._id}`).setLabel('أبيض').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`topic:approve:green:${topic._id}`).setLabel('أخضر').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`topic:approve:yellow:${topic._id}`).setLabel('أصفر').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`topic:approve:red:${topic._id}`).setLabel('أحمر').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`topic:approve:black:${topic._id}`).setLabel('أسود').setStyle(ButtonStyle.Secondary)
          );

          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`topic:reject:${topic._id}`).setLabel('رفض').setStyle(ButtonStyle.Danger)
          );

          const msg = await approvalChannel.send({
            content: 'طلب توبيك جديد للمراجعة:',
            embeds: [topicEmbed(topic, 'Topic Approval')],
            components: [row, row2]
          });

          await setApprovalMessage(topic._id, msg.id);
          return interaction.reply({ content: 'تم إرسال التوبيك للمراجعة ✅', ephemeral: true });
        }

        if (customId.startsWith('debate:objection_submit:')) {
          const debateId = customId.split(':')[2];
          const reason = interaction.fields.getTextInputValue('reason');

          const debate = await Debate.findById(debateId);
          if (!debate) return interaction.reply({ content: 'لم يتم العثور على السجل.', ephemeral: true });

          const topic = await Topic.findById(debate.topicId).catch(() => null);
          const allowed = [topic?.creatorId, topic?.opposerId].filter(Boolean);

          if (!allowed.includes(interaction.user.id)) {
            return interaction.reply({ content: 'فقط أطراف النقاش يقدرون يعترضون.', ephemeral: true });
          }

          if (!debate.objection?.open) {
            return interaction.reply({ content: 'تم إغلاق الاعتراض بالفعل.', ephemeral: true });
          }

          if (debate.objection.expiresAt && new Date() > new Date(debate.objection.expiresAt)) {
            debate.objection.open = false;
            await debate.save();
            return interaction.reply({ content: 'انتهت مدة الاعتراض.', ephemeral: true });
          }

          debate.objection.open = false;
          debate.objection.byUserId = interaction.user.id;
          debate.objection.reason = reason;
          await debate.save();

          const ch = await client.channels.fetch(config.objectionsChannelId).catch(() => null);
          if (ch) {
            await ch.send({
              content: `اعتراض جديد على نتيجة مناظرة:
By: <@${interaction.user.id}>
Winner: <@${debate.winnerId}>
Loser: <@${debate.loserId}>
Topic: ${debate.topicTitle}
Reason: ${reason}`
            });
          }

          return interaction.reply({ content: 'تم إرسال الاعتراض ✅', ephemeral: true });
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('debate:objection:')) {
          const topicId = interaction.customId.split(':')[2];

          const topic = await Topic.findById(topicId).catch(() => null);
          if (!topic || !topic.debateChannelId) {
            return interaction.reply({ content: 'لم يتم العثور على نقاش مرتبط.', ephemeral: true });
          }

          if (interaction.channelId !== topic.debateChannelId) {
            return interaction.reply({ content: 'هذا الزر يعمل داخل روم النقاش فقط.', ephemeral: true });
          }

          const allowed = [topic.creatorId, topic.opposerId];
          if (!allowed.includes(interaction.user.id)) {
            return interaction.reply({ content: 'فقط أطراف النقاش يقدرون يعترضون.', ephemeral: true });
          }

          const debate = await Debate.findOne({ topicId: String(topic._id) }).sort({ createdAt: -1 });
          if (!debate?.objection?.open) {
            return interaction.reply({ content: 'الاعتراض غير متاح.', ephemeral: true });
          }

          if (debate.objection.expiresAt && new Date() > new Date(debate.objection.expiresAt)) {
            debate.objection.open = false;
            await debate.save();
            return interaction.reply({ content: 'انتهت مدة الاعتراض (48 ساعة).', ephemeral: true });
          }

          const modal = new ModalBuilder()
            .setCustomId(`debate:objection_submit:${debate._id.toString()}`)
            .setTitle('اعتراض على النتيجة');

          const reason = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('اكتب سبب الاعتراض')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(reason));
          return interaction.showModal(modal);
        }

        const parts = interaction.customId.split(':');
        const group = parts[0];
        if (group !== 'topic') return;

        const action = parts[1];

        if (action === 'approve') {
          if (!isStaff(interaction)) return interaction.reply({ content: 'هذا الزر للمسؤولين فقط.', ephemeral: true });

          const color = parts[2];
          const topicId = parts[3];

          const topic = await Topic.findById(topicId);
          if (!topic || topic.status !== 'pending') return interaction.reply({ content: 'هذا التوبيك غير متاح للموافقة.', ephemeral: true });

          topic.status = 'published';
          topic.color = color;
          topic.approvedById = interaction.user.id;
          topic.approvedAt = new Date();
          await topic.save();

          const publishChannel = await client.channels.fetch(config.topicPublishChannelId).catch(() => null);
          if (!publishChannel) {
            topic.status = 'closed';
            await topic.save();
            return interaction.reply({ content: 'روم نشر التوبيكات غير مضبوط. راجع .env', ephemeral: true });
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`topic:pick_opposer:${topic._id}`).setLabel('🔴 معارضة').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`topic:pick_judge:${topic._id}`).setLabel('🟢 حكم').setStyle(ButtonStyle.Success)
          );

          const pubMsg = await publishChannel.send({
            content: 'توبيك جديد:',
            embeds: [topicEmbed(topic, 'Published Topic')],
            components: [row]
          });

          await setPublishMessage(topic._id, pubMsg.id);

          await interaction.update({
            content: `تمت الموافقة ✅ اللون: ${color}`,
            embeds: [topicEmbed(topic, 'Approved')],
            components: []
          });

          await sendLog(client, `Topic approved ${topic._id} color=${color} by ${interaction.user.tag}`);
          return;
        }

        if (action === 'reject') {
          if (!isStaff(interaction)) return interaction.reply({ content: 'هذا الزر للمسؤولين فقط.', ephemeral: true });

          const topicId = parts[2];
          const topic = await Topic.findById(topicId);
          if (!topic || topic.status !== 'pending') return interaction.reply({ content: 'هذا التوبيك غير متاح للرفض.', ephemeral: true });

          topic.status = 'rejected';
          topic.rejectedById = interaction.user.id;
          topic.rejectedAt = new Date();
          await topic.save();

          await interaction.update({
            content: 'تم رفض التوبيك ❌',
            embeds: [topicEmbed(topic, 'Rejected')],
            components: []
          });

          await sendLog(client, `Topic rejected ${topic._id} by ${interaction.user.tag}`);
          return;
        }

        if (action === 'pick_opposer') {
          const topicId = parts[2];
          const topic = await Topic.findById(topicId);

          if (!topic || topic.status !== 'published') {
            return interaction.reply({ content: 'هذا التوبيك غير متاح.', ephemeral: true });
          }

          if (!isDebaterMember(interaction.member) && !isStaff(interaction)) {
            return interaction.reply({ content: 'لا تملك رتبة تسمح لك بالمعارضة.', ephemeral: true });
          }

          if (topic.creatorId === interaction.user.id) {
            return interaction.reply({ content: 'ما تقدر تعارض توبيكك.', ephemeral: true });
          }

          if (topic.opposerId) {
            return interaction.reply({ content: 'تم اختيار معارض بالفعل.', ephemeral: true });
          }

          topic.opposerId = interaction.user.id;
          await topic.save();

          await interaction.reply({ content: 'تم تسجيلك كمعارض ✅', ephemeral: true });
          await sendLog(client, `Opposer picked topic=${topic._id} opposer=${interaction.user.tag}`);

          await tryCreateDebateRoom({ client, guild: interaction.guild, topic });
          return;
        }

        if (action === 'pick_judge') {
          const topicId = parts[2];
          const topic = await Topic.findById(topicId);

          if (!topic || topic.status !== 'published') {
            return interaction.reply({ content: 'هذا التوبيك غير متاح.', ephemeral: true });
          }

          if (!isJudgeMember(interaction.member) && !isStaff(interaction)) {
            return interaction.reply({ content: 'لا تملك رتبة تسمح لك بالتحكيم.', ephemeral: true });
          }

          if (topic.judgeId) {
            return interaction.reply({ content: 'تم اختيار حكم بالفعل.', ephemeral: true });
          }

          topic.judgeId = interaction.user.id;
          await topic.save();

          await interaction.reply({ content: 'تم تسجيلك كحكم ✅', ephemeral: true });
          await sendLog(client, `Judge picked topic=${topic._id} judge=${interaction.user.tag}`);

          await tryCreateDebateRoom({ client, guild: interaction.guild, topic });
          return;
        }
      }
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        interaction.followUp({ content: 'صار خطأ أثناء التنفيذ.', ephemeral: true }).catch(() => {});
      } else {
        interaction.reply({ content: 'صار خطأ أثناء التنفيذ.', ephemeral: true }).catch(() => {});
      }
    }
  }
};