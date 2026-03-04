import { Client, GatewayIntentBits, Collection } from 'discord.js';
import mongoose from 'mongoose';
import chalk from 'chalk';
import config from './config.js';
import fs from 'fs';
import path from 'path';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.inviteCache = new Map();

process.on('uncaughtException', err => {
  console.error(chalk.red('Uncaught Exception:'), err);
});

process.on('unhandledRejection', err => {
  console.error(chalk.red('Unhandled Rejection:'), err);
});

mongoose.connect(config.mongoURI)
  .then(() => console.log(chalk.green('✅ MongoDB Connected')))
  .catch(err => console.error(chalk.red('MongoDB Error:'), err));

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const mod = await import(`./commands/${file}`);
  const cmd = mod?.default;

  if (!cmd?.data?.name || typeof cmd.execute !== 'function') {
    console.log(chalk.yellow(`⚠️ Skipping invalid command file: ${file}`));
    continue;
  }

  client.commands.set(cmd.data.name, cmd);
}

const eventsPath = path.resolve('./events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const mod = await import(`./events/${file}`);
  const ev = mod?.default;

  if (!ev?.name || typeof ev.execute !== 'function') {
    console.log(chalk.yellow(`⚠️ Skipping invalid event file: ${file}`));
    continue;
  }

  if (ev.once) {
    client.once(ev.name, (...args) => ev.execute(...args, client));
  } else {
    client.on(ev.name, (...args) => ev.execute(...args, client));
  }
}

client.login(config.token);