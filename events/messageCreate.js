import { checkMessageModeration, applyThreeStrikesLoss } from '../services/moderationService.js';
import { addScore } from '../services/scoreService.js';
import Topic from '../models/Topic.js';
import BadWordsGroup from '../models/BadWordsGroup.js';

function normalizeArabic(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[^ء-يa-z0-9\s]/gi, '')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLoose(text) {
  return normalizeArabic(text).replace(/(.)\1+/g, '$1');
}

function buildVariants(word) {
  const a = normalizeArabic(word);
  const b = normalizeLoose(word);
  return [...new Set([a, b].filter(Boolean))];
}

function detectBadWord(content, groups) {
  const normalized = normalizeArabic(content);
  const loose = normalizeLoose(content);

  for (const group of groups || []) {
    const words = Array.isArray(group.words) ? group.words : [];
    for (const rawWord of words) {
      const variants = buildVariants(rawWord);
      for (const v of variants) {
        if (v && (normalized.includes(v) || loose.includes(v))) {
          return { matchedWord: rawWord, group };
        }
      }
    }
  }
  return null;
}

async function sendTempChannelWarning(channel, text, ms = 5000) {
  const m = await channel.send({ content: text }).catch(() => null);
  if (!m) return;
  setTimeout(() => m.delete().catch(() => {}), ms);
}

export default {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (!message?.guild || !message?.author || message.author.bot) return;

    try {
      const groups = await BadWordsGroup.find({ guildId: message.guild.id }).lean().catch(() => []);
      const found = detectBadWord(message.content, groups);

      if (found) {
        const penalty = Math.abs(Number(found.group?.integrityPenalty || 0));
        const matchedWord = found.matchedWord;

        const isDebateRoom = await Topic.findOne({ debateChannelId: message.channelId }).lean().catch(() => null);

        await message.delete().catch(() => {});

        if (penalty > 0) {
          await addScore(message.author.id, 'integrity', -penalty).catch(() => {});
        }

        const dmText = `تم حذف رسالتك وخصم ${penalty} من النزاهة بسبب كلمة ممنوعة (${matchedWord}). لا تكررها حتى لا تتعرض للطرد.`;

        if (isDebateRoom) {
          await message.channel.send({
            content: `<@${message.author.id}> ممنوع الألفاظ داخل النقاش. تم حذف الرسالة وخصم ${penalty} نزاهة.`
          }).catch(() => {});
        } else {
          const dmOk = await message.author.send(dmText).then(() => true).catch(() => false);

          if (!dmOk) {
            await sendTempChannelWarning(
              message.channel,
              `<@${message.author.id}> تم حذف رسالتك وخصم ${penalty} نزاهة بسبب كلمة ممنوعة. (فعّل الخاص لاستلام التفاصيل)`,
              5000
            );
          }
        }

        return;
      }

      const res = await checkMessageModeration(message);
      if (!res) return;

      const { nextCount, trigger, topic } = res;

      const warn = await message.reply(`يرجى عدم قول (${trigger}) لأنها قد تتسبب في طردك. تحذير: ${nextCount}/3`).catch(() => null);
      if (warn && !topic) {
        setTimeout(() => warn.delete().catch(() => {}), 8000);
      }

      if (nextCount >= 3) {
        await applyThreeStrikesLoss({
          guild: message.guild,
          channel: message.channel,
          userId: message.author.id,
          topic
        });
      }
    } catch (err) {
      console.error('[messageCreate] error:', err);
    }
  }
};