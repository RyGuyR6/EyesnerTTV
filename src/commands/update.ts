/**
 * /update command – applies template updates without deleting custom channels.
 * Functionally identical to /setup with a clear description of intent.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from 'discord.js';
import { BotCommand } from '../types';
import { analyzeGuild, runSetup } from '../utils/setupEngine';
import { summaryEmbed, errorEmbed, infoEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';

export const update: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription(
      'Apply future EyesnerTTV template updates without deleting any custom channels or roles.'
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction, _client: Client): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [errorEmbed('Server Only', 'This command can only be used in a server.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const plan = analyzeGuild(guild);
    const total =
      plan.missingRoles.length +
      plan.missingCategories.length +
      plan.missingChannels.length;

    if (total === 0) {
      await interaction.editReply({
        embeds: [
          infoEmbed(
            'Already Up to Date',
            'Your server already has all EyesnerTTV items. No update needed.'
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        infoEmbed(
          'Updating…',
          `Found ${total} new item(s) in the latest template. Adding them now…\n` +
            '⚠️ No existing channels, roles, or messages will be deleted.'
        ),
      ],
    });

    const result = await runSetup(guild, false);

    await interaction.editReply({ embeds: [summaryEmbed(result)] });

    logger.info(`Update completed by ${interaction.user.tag} on guild ${guild.id}`);
  },
};
