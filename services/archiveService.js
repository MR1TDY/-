import config from '../config.js';

export async function sendDebateArchive(client, payload) {
  const ch = await client.channels.fetch(config.debateArchiveChannelId).catch(() => null);
  if (!ch) return null;

  const msg = await ch.send(payload);
  return msg.id;
}