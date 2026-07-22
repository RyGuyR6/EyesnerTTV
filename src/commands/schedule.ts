/**
 * /schedule command – post or edit the official stream schedule embed.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
  ChannelType,
  BaseGuildTextChannel,
} from 'discord.js';
import { BotCommand } from '../types';
import {
  errorEmbed,
  infoEmbed,
  officialStreamScheduleEmbed,
  warnEmbed,
} from '../utils/embeds';

function isScheduleChannel(
  channel: unknown
): channel is BaseGuildTextChannel {
  if (!channel || typeof channel !== 'object') return false;
  return (
    'type' in channel &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) &&
    'send' in channel &&
    'messages' in channel
  );
}

export const schedule: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Post or edit the official stream schedule embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('post')
        .setDescription('Post a new official stream schedule embed.')
        .addStringOption((option) =>
          option
            .setName('details')
            .setDescription('Schedule details (days, times, notes).')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Optional custom title for the schedule embed.')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to post in (defaults to current channel).')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription('Edit an existing official stream schedule embed by message ID.')
        .addStringOption((option) =>
          option
            .setName('message_id')
            .setDescription('Message ID of the schedule embed to edit.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('details')
            .setDescription('Updated schedule details (days, times, notes).')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Optional custom title for the schedule embed.')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel containing the message (defaults to current channel).')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
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

    const subcommand = interaction.options.getSubcommand();
    const details = interaction.options.getString('details', true);
    const title = interaction.options.getString('title') ?? undefined;
    const selectedChannel = interaction.options.getChannel('channel');
    const channel = (selectedChannel ?? interaction.channel) as unknown;

    if (!isScheduleChannel(channel)) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Unsupported Channel',
            'Use this command in a server text or announcement channel.'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const embed = officialStreamScheduleEmbed({
      title,
      details,
      editorTag: interaction.user.tag,
    });

    if (subcommand === 'post') {
      const posted = await channel.send({ embeds: [embed] });
      await interaction.editReply({
        embeds: [
          infoEmbed('Schedule Posted', `Official stream schedule posted: ${posted.url}`),
        ],
      });
      return;
    }

    const messageId = interaction.options.getString('message_id', true);
    try {
      const targetMessage = await channel.messages.fetch(messageId);
      if (targetMessage.author.id !== interaction.client.user?.id) {
        await interaction.editReply({
          embeds: [
            warnEmbed(
              'Cannot Edit Message',
              'That message was not posted by this bot, so Discord does not allow editing it.'
            ),
          ],
        });
        return;
      }

      await targetMessage.edit({ embeds: [embed] });
      await interaction.editReply({
        embeds: [
          infoEmbed('Schedule Updated', `Official stream schedule updated: ${targetMessage.url}`),
        ],
      });
    } catch {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Message Not Found',
            'Could not find that message ID in the selected channel. Check the ID and try again.'
          ),
        ],
      });
    }
  },
};
