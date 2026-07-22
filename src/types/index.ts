/**
 * Core type definitions for EyesnerTTV bot.
 */
import {
  PermissionResolvable,
  CategoryChannel,
  TextChannel,
  VoiceChannel,
  Role,
  Guild,
} from 'discord.js';

// ─── Template Types ────────────────────────────────────────────────────────────

export interface RoleTemplate {
  name: string;
  color: number;
  hoist: boolean;
  mentionable: boolean;
  position: number; // higher = more powerful (relative ordering)
  permissions: readonly PermissionResolvable[];
}

export interface ChannelTemplate {
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic?: string;
  /** Roles allowed to view (undefined = inherit from category) */
  allowView?: string[];
  /** Roles allowed to send messages */
  allowSend?: string[];
  /** Roles denied send messages */
  denySend?: string[];
  /** nsfw flag */
  nsfw?: boolean;
}

export interface CategoryTemplate {
  name: string;
  channels: ChannelTemplate[];
  /** Roles allowed to see the category (undefined = everyone) */
  allowView?: string[];
}

export interface ServerTemplate {
  name: string;
  roles: RoleTemplate[];
  categories: CategoryTemplate[];
}

// ─── Setup Result Types ────────────────────────────────────────────────────────

export type ItemStatus = 'created' | 'skipped' | 'failed';

export interface SetupItem {
  type: 'role' | 'category' | 'channel';
  name: string;
  status: ItemStatus;
  reason?: string;
}

export interface SetupResult {
  items: SetupItem[];
  dryRun: boolean;
}

export interface GuildSnapshot {
  roles: Role[];
  categories: CategoryChannel[];
  textChannels: TextChannel[];
  voiceChannels: VoiceChannel[];
  guild: Guild;
}

// ─── Command Interface ─────────────────────────────────────────────────────────

import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  Client,
} from 'discord.js';

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;
}

// ─── Env Config ───────────────────────────────────────────────────────────────

export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dryRun: boolean;
}
