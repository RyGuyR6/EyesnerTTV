/**
 * /rules command – posts the official EyesnerTTV rules embed.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from 'discord.js';
import { BotCommand } from '../types';
import { errorEmbed, infoEmbed, officialRulesEmbed } from '../utils/embeds';

export const rules: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Post the official rules embed in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName('pin')
        .setDescription('Pin the posted rules message (default: true).')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, _client: Client): Promise<void> {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [errorEmbed('Server Only', 'This command can only be used in a server.')],
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.reply({
        embeds: [errorEmbed('Unsupported Channel', 'Run this command in a server text channel.')],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const shouldPin = interaction.options.getBoolean('pin') ?? true;
    const message = await channel.send({ embeds: [officialRulesEmbed()] });

    let pinNote = 'Message posted.';
    if (shouldPin) {
      try {
        await message.pin('Official server rules');
        pinNote = 'Message posted and pinned.';
      } catch {
        pinNote = 'Message posted, but pin failed (check Manage Messages permission).';
      }
    }

    await interaction.editReply({
      embeds: [
        infoEmbed('Rules Published', `${pinNote}\n\nJump to message: ${message.url}`),
      ],
    });
  },
};
