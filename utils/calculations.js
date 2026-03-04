export function calcWinRate(wins, losses) {
  const total = (wins || 0) + (losses || 0);
  if (total <= 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

export function calcAveragePerformance(total, count) {
  if (!count || count <= 0) return 0;
  return Math.round((total / count) * 10) / 10;
}

export function performanceLabel(score) {
  const s = Math.round(score);
  const map = {
    10: 'الموسوعة',
    9: 'الأسطورة',
    8: 'المحترف',
    7: 'المحلل',
    6: 'منطقي',
    5: 'المجتهد',
    4: 'الهاوي',
    3: 'العاطفي',
    2: 'المبدئي',
    1: 'المهرطق',
    0: 'اعتزل'
  };
  return map[s] ?? 'غير محدد';
}