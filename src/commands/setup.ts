/**
 * /setup command – the primary command for building the EyesnerTTV server structure.
 */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import { BotCommand } from '../types';
import { analyzeGuild, runSetup, checkRoleHierarchy } from '../utils/setupEngine';
import { previewEmbed, summaryEmbed, errorEmbed, warnEmbed, infoEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';

const TIMEOUT_MS = 120_000; // 2 minutes to respond to buttons

export const setup: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the EyesnerTTV Streamer Community server structure.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction, _client: Client): Promise<void> {
    // ── Permission check ───────────────────────────────────────────────────
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        embeds: [errorEmbed('Server Only', 'This command can only be used in a server.')],
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    const isOwner = guild.ownerId === interaction.user.id;
    const hasAdmin =
      member &&
      'permissions' in member &&
      (member.permissions as { has: (perm: bigint) => boolean }).has(
        PermissionFlagsBits.Administrator
      );

    if (!isOwner && !hasAdmin) {
      await interaction.reply({
        embeds: [
          errorEmbed(
            'Permission Denied',
            'You must be the server owner or have Administrator permission to run /setup.'
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // ── Analyze guild ──────────────────────────────────────────────────────
    const plan = analyzeGuild(guild);
    const hierarchyReport = checkRoleHierarchy(guild);

    // ── Show preview embed ─────────────────────────────────────────────────
    const embed = previewEmbed(
      plan.missingRoles,
      plan.missingCategories,
      plan.missingChannels.map((c) => `${c.name} (in ${c.category})`),
      false
    );

    if (!hierarchyReport.ok) {
      embed.addFields({
        name: '⚠️ Role Hierarchy Issues',
        value: hierarchyReport.issues.join('\n').slice(0, 1024),
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_install')
        .setLabel('Install')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('setup_preview')
        .setLabel('Preview Only')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    const previewMsg = await interaction.editReply({
      embeds: [embed],
      components: [row],
    });

    // ── Wait for button press ──────────────────────────────────────────────
    try {
      const buttonInteraction = await previewMsg.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: TIMEOUT_MS,
      });

      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === 'setup_cancel') {
        await interaction.editReply({
          embeds: [infoEmbed('Cancelled', 'Setup was cancelled. No changes were made.')],
          components: [],
        });
        return;
      }

      const isDryRun = buttonInteraction.customId === 'setup_preview';

      // ── Confirmation prompt before real install ────────────────────────
      if (!isDryRun) {
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('setup_confirm_yes')
            .setLabel('Yes, Install')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('setup_confirm_no')
            .setLabel('No, Cancel')
            .setStyle(ButtonStyle.Secondary)
        );

        const confirmMsg = await interaction.editReply({
          embeds: [
            warnEmbed(
              'Confirm Installation',
              'Are you sure you want to apply the EyesnerTTV server structure?\n\n' +
                '• Only **missing** roles, categories, and channels will be created.\n' +
                '• **Nothing will be deleted.**\n' +
                '• Existing items with matching names will be skipped.'
            ),
          ],
          components: [confirmRow],
        });

        const confirmInteraction = await confirmMsg.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === interaction.user.id,
          time: TIMEOUT_MS,
        });

        await confirmInteraction.deferUpdate();

        if (confirmInteraction.customId === 'setup_confirm_no') {
          await interaction.editReply({
            embeds: [infoEmbed('Cancelled', 'Setup was cancelled. No changes were made.')],
            components: [],
          });
          return;
        }
      }

      // ── Running indicator ──────────────────────────────────────────────
      await interaction.editReply({
        embeds: [
          infoEmbed(
            isDryRun ? 'Running Dry-Run…' : 'Installing…',
            isDryRun
              ? 'Simulating setup. No changes will be made.'
              : 'Creating missing roles, categories, and channels. This may take a moment…'
          ),
        ],
        components: [],
      });

      // ── Execute setup ──────────────────────────────────────────────────
      const result = await runSetup(guild, isDryRun);

      // ── Final summary ──────────────────────────────────────────────────
      await interaction.editReply({
        embeds: [summaryEmbed(result)],
        components: [],
      });

      logger.info(
        `Setup completed by ${interaction.user.tag} on guild ${guild.id} ` +
          `(dry=${isDryRun}, created=${result.items.filter((i) => i.status === 'created').length})`
      );
    } catch (err: unknown) {
      // Timeout or unexpected error
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('time')) {
        await interaction.editReply({
          embeds: [infoEmbed('Timed Out', 'No response received within 2 minutes. Setup cancelled.')],
          components: [],
        });
      } else {
        logger.error('Setup command error', err);
        await interaction.editReply({
          embeds: [errorEmbed('Unexpected Error', `An error occurred: ${message}`)],
          components: [],
        });
      }
    }
  },
};
