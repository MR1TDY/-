import { REST, Routes } from 'discord.js';
import fs from 'fs';
import config from './config.js';

const commands = [];
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of files) {
  const cmd = await import(`./commands/${file}`);
  commands.push(cmd.default.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

await rest.put(
  Routes.applicationGuildCommands(config.clientId, config.guildId),
  { body: commands }
);

console.log('✅ Slash commands deployed');