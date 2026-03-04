import Stats from '../models/Stats.js';

export async function applyResult({ winnerId, loserId, performanceScore }) {
  const winner = await Stats.findOneAndUpdate(
    { userId: winnerId },
    {
      $inc: { debates: 1, wins: 1, performanceTotal: performanceScore, performanceCount: 1 },
      $set: { updatedAt: new Date() }
    },
    { upsert: true, new: true }
  );

  const loser = await Stats.findOneAndUpdate(
    { userId: loserId },
    {
      $inc: { debates: 1, losses: 1, performanceTotal: performanceScore, performanceCount: 1 },
      $set: { updatedAt: new Date() }
    },
    { upsert: true, new: true }
  );

  const newWinnerStreak = (winner.currentStreak || 0) + 1;
  winner.currentStreak = newWinnerStreak;
  if (!winner.maxStreak || newWinnerStreak > winner.maxStreak) winner.maxStreak = newWinnerStreak;
  await winner.save();

  loser.currentStreak = 0;
  await loser.save();

  return { winner, loser };
}