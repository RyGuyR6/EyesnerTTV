/**
 * EyesnerTTV Bot – Entry Point
 */
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { loadConfig } from './config/env';
import { commands } from './commands';
import { deployCommands } from './utils/deploy';
import { logger, setLogLevel } from './utils/logger';

async function main(): Promise<void> {
  // ── Load and validate config ─────────────────────────────────────────────
  const config = loadConfig();
  setLogLevel(config.logLevel);

  if (config.dryRun) {
    logger.warn('DRY_RUN mode is enabled globally. No real Discord changes will be made.');
  }

  // ── Deploy slash commands ─────────────────────────────────────────────────
  await deployCommands();

  // ── Create Discord client ─────────────────────────────────────────────────
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  // ── Ready event ───────────────────────────────────────────────────────────
  client.once(Events.ClientReady, (c) => {
    logger.info(`✅ Logged in as ${c.user.tag}`);
    logger.info(`Serving guild: ${config.guildId}`);
  });

  // ── Interaction handler ───────────────────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command received: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Error executing /${interaction.commandName}`, err);
      const errorMsg = { content: '❌ An unexpected error occurred.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg).catch(() => undefined);
      } else {
        await interaction.reply(errorMsg).catch(() => undefined);
      }
    }
  });

  // ── Login ─────────────────────────────────────────────────────────────────
  await client.login(config.token);
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
