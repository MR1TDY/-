import Stats from '../models/Stats.js';

export async function getOrCreateStats(userId) {
  let doc = await Stats.findOne({ userId });
  if (!doc) doc = await Stats.create({ userId });
  return doc;
}

export async function topBy(metric, limit = 10) {
  const allowed = new Set([
    'wins', 'losses', 'debates', 'draws',
    'judgeCount', 'currentStreak', 'maxStreak',
    'acceptedObjections', 'rejectedObjections', 'weeklyParticipation'
  ]);
  if (!allowed.has(metric)) metric = 'wins';

  return Stats.find().sort({ [metric]: -1 }).limit(limit);
}