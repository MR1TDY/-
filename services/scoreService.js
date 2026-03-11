import Score from '../models/Score.js';

export async function getOrCreateScore(userId) {
  let doc = await Score.findOne({ userId });
  if (!doc) doc = await Score.create({ userId });
  return doc;
}

export async function addDebatePoints(userId, points) {
  return Score.findOneAndUpdate(
    { userId },
    { $inc: { debates: points } },
    { upsert: true, new: true }
  );
}

export async function addScore(userId, field, points) {
  return Score.findOneAndUpdate(
    { userId },
    { $inc: { [field]: points } },
    { upsert: true, new: true }
  );
}