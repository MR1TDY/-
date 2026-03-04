import Counter from '../models/Counter.js';

export async function nextRegistrationNumber() {
  const doc = await Counter.findOneAndUpdate(
    { key: 'registrationNumber' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}