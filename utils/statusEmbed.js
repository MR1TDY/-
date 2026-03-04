import { EmbedBuilder } from 'discord.js';
import { calcWinRate, calcAveragePerformance, performanceLabel } from './calculations.js';

export function statusEmbed(member, statsDoc) {
  const s = statsDoc || {};
  const winRate = calcWinRate(s.wins, s.losses);
  const avgPerf = calcAveragePerformance(s.performanceTotal, s.performanceCount);
  const perfName = performanceLabel(avgPerf);

  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('Status')
    .setThumbnail(member.displayAvatarURL())
    .addFields(
      { name: 'عدد النقاشات', value: String(s.debates ?? 0), inline: true },
      { name: 'عدد فوز', value: String(s.wins ?? 0), inline: true },
      { name: 'عدد تعادل', value: String(s.draws ?? 0), inline: true },

      { name: 'عدد الخسارة', value: String(s.losses ?? 0), inline: true },
      { name: 'عدد الاقصاء', value: String(s.eliminations ?? 0), inline: true },
      { name: 'عدد الانسحاب', value: String(s.withdrawals ?? 0), inline: true },

      { name: 'WL (نسبة الفوز)', value: `${winRate}%`, inline: true },
      { name: 'متوسط الأداء', value: `${avgPerf} (${perfName})`, inline: true },
      { name: 'عدد مرات التحكيم', value: String(s.judgeCount ?? 0), inline: true },

      { name: 'سلسلة بدون خسارة (حالياً)', value: String(s.currentStreak ?? 0), inline: true },
      { name: 'أعلى سلسلة بدون خسارة', value: String(s.maxStreak ?? 0), inline: true },
      { name: 'مشاركات أسبوعية', value: String(s.weeklyParticipation ?? 0), inline: true },

      { name: 'اعتراضات مقبولة', value: String(s.acceptedObjections ?? 0), inline: true },
      { name: 'اعتراضات مرفوضة', value: String(s.rejectedObjections ?? 0), inline: true }
    )
    .setFooter({ text: 'Anime Debate System' });
}