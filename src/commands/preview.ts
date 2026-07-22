/**
 * /preview command – shows what /setup would create without making changes.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from 'discord.js';
import { BotCommand } from '../types';
import { analyzeGuild, checkRoleHierarchy } from '../utils/setupEngine';
import { previewEmbed, errorEmbed } from '../utils/embeds';

export const preview: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('preview')
    .setDescription('Preview what /setup would create without making any changes.')
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
    const hierarchyReport = checkRoleHierarchy(guild);

    const embed = previewEmbed(
      plan.missingRoles,
      plan.missingCategories,
      plan.missingChannels.map((c) => `${c.name} (in ${c.category})`),
      true
    );

    if (!hierarchyReport.ok) {
      embed.addFields({
        name: '⚠️ Role Hierarchy Issues',
        value: hierarchyReport.issues.join('\n').slice(0, 1024),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
