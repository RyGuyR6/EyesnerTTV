/**
 * Registers slash commands with Discord for the configured guild.
 * Run this script whenever commands change.
 */
import { REST, Routes } from 'discord.js';
import { loadConfig } from '../config/env';
import { commands } from '../commands';
import { logger } from '../utils/logger';

export async function deployCommands(): Promise<void> {
  const config = loadConfig();

  const commandData = [...commands.values()].map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  logger.info(`Deploying ${commandData.length} slash command(s) to guild ${config.guildId}…`);

  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: commandData,
  });

  logger.info('Slash commands deployed successfully.');
}
