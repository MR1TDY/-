import { SlashCommandBuilder } from 'discord.js';
import { isStaff } from '../utils/permissions.js';
import Settings from '../models/Settings.js';

async function getSettings() {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
}

export default {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation settings')
    .addSubcommand(sc =>
      sc.setName('addword')
        .setDescription('Add bad word')
        .addStringOption(o => o.setName('word').setDescription('word').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('delword')
        .setDescription('Delete bad word')
        .addStringOption(o => o.setName('word').setDescription('word').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('list')
        .setDescription('List bad words')
    )
    .addSubcommand(sc =>
      sc.setName('toggle')
        .setDescription('Enable/disable moderation')
        .addBooleanOption(o => o.setName('enabled').setDescription('true/false').setRequired(true))
    ),

  async execute(interaction) {
    if (!isStaff(interaction)) return interaction.reply({ content: 'للمسؤولين فقط.', ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const s = await getSettings();

    if (sub === 'addword') {
      const word = interaction.options.getString('word').trim();
      s.badWords = Array.from(new Set([...(s.badWords || []), word]));
      await s.save();
      return interaction.reply({ content: `تمت إضافة كلمة: ${word}`, ephemeral: true });
    }

    if (sub === 'delword') {
      const word = interaction.options.getString('word').trim();
      s.badWords = (s.badWords || []).filter(w => w !== word);
      await s.save();
      return interaction.reply({ content: `تم حذف كلمة: ${word}`, ephemeral: true });
    }

    if (sub === 'list') {
      const list = (s.badWords || []).join(', ') || 'لا يوجد';
      return interaction.reply({ content: `BadWords: ${list}`, ephemeral: true });
    }

    if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      s.moderationEnabled = enabled;
      await s.save();
      return interaction.reply({ content: enabled ? 'تم تفعيل المراقبة' : 'تم إيقاف المراقبة', ephemeral: true });
    }
  }
};