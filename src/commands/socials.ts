/**
 * /socials command – post or edit the official socials embed.
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
  officialSocialsEmbed,
  warnEmbed,
} from '../utils/embeds';

function isGuildPostChannel(channel: unknown): channel is BaseGuildTextChannel {
  if (!channel || typeof channel !== 'object') return false;
  return (
    'type' in channel &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) &&
    'send' in channel &&
    'messages' in channel
  );
}

function buildSocialsEmbed(interaction: ChatInputCommandInteraction) {
  return officialSocialsEmbed({
    title: interaction.options.getString('title') ?? undefined,
    editorTag: interaction.user.tag,
    twitchUrl: interaction.options.getString('twitch') ?? undefined,
    tiktokUrl: interaction.options.getString('tiktok') ?? undefined,
    youtubeUrl: interaction.options.getString('youtube') ?? undefined,
    xUrl: interaction.options.getString('x') ?? undefined,
    instagramUrl: interaction.options.getString('instagram') ?? undefined,
  });
}

export const socials: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('socials')
    .setDescription('Post or edit the official socials embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) => {
      subcommand
        .setName('post')
        .setDescription('Post a new official socials embed.')
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Optional custom title for the socials embed.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('twitch')
            .setDescription('Twitch URL override.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('tiktok')
            .setDescription('TikTok URL override.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('youtube')
            .setDescription('YouTube URL (optional).')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('x')
            .setDescription('X/Twitter URL (optional).')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('instagram')
            .setDescription('Instagram URL (optional).')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel to post in (defaults to current channel).')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        );
      return subcommand;
    })
    .addSubcommand((subcommand) => {
      subcommand
        .setName('edit')
        .setDescription('Edit an existing official socials embed by message ID.')
        .addStringOption((option) =>
          option
            .setName('message_id')
            .setDescription('Message ID of the socials embed to edit.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Optional custom title for the socials embed.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('twitch')
            .setDescription('Twitch URL override.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('tiktok')
            .setDescription('TikTok URL override.')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('youtube')
            .setDescription('YouTube URL (optional).')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('x')
            .setDescription('X/Twitter URL (optional).')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('instagram')
            .setDescription('Instagram URL (optional).')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel containing the message (defaults to current channel).')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        );
      return subcommand;
    }),

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
    const selectedChannel = interaction.options.getChannel('channel');
    const channel = (selectedChannel ?? interaction.channel) as unknown;

    if (!isGuildPostChannel(channel)) {
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
    const embed = buildSocialsEmbed(interaction);

    if (subcommand === 'post') {
      const posted = await channel.send({ embeds: [embed] });
      await interaction.editReply({
        embeds: [
          infoEmbed('Socials Posted', `Official socials embed posted: ${posted.url}`),
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
          infoEmbed('Socials Updated', `Official socials embed updated: ${targetMessage.url}`),
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
