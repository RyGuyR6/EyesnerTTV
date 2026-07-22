/**
 * /backup command – exports the current server structure to JSON.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder,
} from 'discord.js';
import { BotCommand } from '../types';
import { errorEmbed, infoEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';

export const backup: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Export the current server structure to a JSON file.')
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

    try {
      // Fetch full guild data
      await guild.fetch();
      await guild.roles.fetch();
      await guild.channels.fetch();

      const roles = guild.roles.cache
        .filter((r) => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          hoist: r.hoist,
          mentionable: r.mentionable,
          position: r.position,
        }));

      const categories = guild.channels.cache
        .filter((c) => c.type === ChannelType.GuildCategory)
        .map((c) => ({
          id: c.id,
          name: c.name,
          position: 'position' in c ? c.position : 0,
          channels: guild.channels.cache
            .filter(
              (ch) =>
                'parentId' in ch &&
                ch.parentId === c.id
            )
            .map((ch) => ({
              id: ch.id,
              name: ch.name,
              type: ChannelType[ch.type],
              position: 'position' in ch ? ch.position : 0,
            })),
        }));

      const uncategorized = guild.channels.cache
        .filter(
          (c) =>
            'parentId' in c &&
            c.parentId === null &&
            c.type !== ChannelType.GuildCategory
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          type: ChannelType[c.type],
        }));

      const snapshot = {
        exportedAt: new Date().toISOString(),
        guildId: guild.id,
        guildName: guild.name,
        roles,
        categories,
        uncategorized,
      };

      const json = JSON.stringify(snapshot, null, 2);
      const buffer = Buffer.from(json, 'utf-8');
      const filename = `backup-${guild.id}-${Date.now()}.json`;

      const attachment = new AttachmentBuilder(buffer, { name: filename });

      await interaction.editReply({
        embeds: [
          infoEmbed(
            'Backup Complete',
            `Server structure exported to **${filename}**.\n` +
              `Roles: ${roles.length} | Categories: ${categories.length}`
          ),
        ],
        files: [attachment],
      });

      logger.info(`Backup created by ${interaction.user.tag} on guild ${guild.id}`);
    } catch (err) {
      logger.error('Backup command error', err);
      await interaction.editReply({
        embeds: [errorEmbed('Backup Failed', `An error occurred: ${String(err)}`)],
      });
    }
  },
};
