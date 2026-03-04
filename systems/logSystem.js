import config from '../config.js';

export async function sendLog(client, message) {
  if (!config.logChannelId) return;
  const channel = await client.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel) return;
  channel.send(`📌 ${message}`);
}
