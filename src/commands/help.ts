/**
 * /help command – explains all EyesnerTTV commands.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
} from 'discord.js';
import { BotCommand } from '../types';
import { brandEmbed } from '../utils/embeds';

export const help: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Explains all EyesnerTTV bot commands.'),

  async execute(interaction: ChatInputCommandInteraction, _client: Client): Promise<void> {
    const embed = brandEmbed()
      .setTitle('📖 EyesnerTTV Bot – Command Reference')
      .setDescription(
        'EyesnerTTV is a temporary setup bot for building a polished streamer community server.\n' +
          'All commands require **Administrator** permission except `/help`.'
      )
      .addFields(
        {
          name: '⚙️ `/setup`',
          value:
            'Analyzes your server, shows an interactive preview, and creates only the missing ' +
            'roles, categories, and channels. Requires confirmation before applying changes. ' +
            'Safe to run more than once.',
        },
        {
          name: '🔍 `/preview`',
          value:
            'Shows exactly what `/setup` would create without changing anything. ' +
            'Use this to inspect before installing.',
        },
        {
          name: '🔧 `/repair`',
          value:
            'Recreates any EyesnerTTV roles, categories, or channels that are missing. ' +
            'Will never delete existing items.',
        },
        {
          name: '🔄 `/update`',
          value:
            'Applies updates from the latest EyesnerTTV template without removing any custom channels.',
        },
        {
          name: '💾 `/backup`',
          value: 'Exports the current server structure (roles, categories, channels) to a JSON file.',
        },
        {
          name: '❓ `/help`',
          value: 'Shows this help message.',
        },
        {
          name: '🚫 This bot does NOT include',
          value:
            '• Ticket system\n• Economy system\n• Leveling system\n• Music bot\n' +
            '• AI chat\n• Twitch live monitoring\n• 24/7 hosting requirements',
        },
        {
          name: '🔒 Safety Guarantees',
          value:
            '• **Never deletes** channels, roles, or messages\n' +
            '• Skips items that already exist\n' +
            '• Requires confirmation before real changes\n' +
            '• Least-privilege permissions throughout',
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
