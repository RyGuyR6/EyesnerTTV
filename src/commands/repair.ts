/**
 * /repair command – recreates missing EyesnerTTV items.
 * Safe to run at any time; will never delete existing items.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from 'discord.js';
import { BotCommand } from '../types';
import { analyzeGuild, runSetup, checkRoleHierarchy } from '../utils/setupEngine';
import { summaryEmbed, errorEmbed, infoEmbed, warnEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';

export const repair: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('repair')
    .setDescription('Recreate missing EyesnerTTV roles, categories, and channels.')
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
        embeds: [infoEmbed('Nothing to Repair', 'All EyesnerTTV items are already in place.')],
      });
      return;
    }

    const hierarchyReport = checkRoleHierarchy(guild);
    if (!hierarchyReport.ok) {
      await interaction.editReply({
        embeds: [
          warnEmbed(
            'Role Hierarchy Issues Detected',
            hierarchyReport.issues.join('\n') +
              '\n\nRepairing anyway – some role operations may fail.'
          ),
        ],
      });
    }

    await interaction.editReply({
      embeds: [infoEmbed('Repairing…', `Found ${total} missing item(s). Recreating now…`)],
    });

    const result = await runSetup(guild, false);

    await interaction.editReply({ embeds: [summaryEmbed(result)] });

    logger.info(`Repair completed by ${interaction.user.tag} on guild ${guild.id}`);
  },
};
