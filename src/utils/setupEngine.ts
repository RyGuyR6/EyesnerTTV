/**
 * Core setup engine: analyzes the guild and applies the template.
 * All operations are non-destructive – existing items are never deleted.
 */
import {
  Guild,
  Role,
  CategoryChannel,
  ChannelType,
  PermissionFlagsBits,
  OverwriteType,
  OverwriteData,
} from 'discord.js';
import { TEMPLATE } from '../config/template';
import { SetupItem, SetupResult, RoleTemplate, ChannelTemplate, CategoryTemplate } from '../types';
import { logger } from './logger';
import { withRetry } from './rateLimit';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalise(name: string): string {
  return name.trim().toLowerCase();
}

function findRole(guild: Guild, name: string): Role | undefined {
  return guild.roles.cache.find((r) => normalise(r.name) === normalise(name));
}

function findCategory(guild: Guild, name: string): CategoryChannel | undefined {
  return guild.channels.cache.find(
    (c): c is CategoryChannel =>
      c.type === ChannelType.GuildCategory && normalise(c.name) === normalise(name)
  ) as CategoryChannel | undefined;
}

function findChannel(guild: Guild, name: string, parentId?: string): boolean {
  return guild.channels.cache.some((c) => {
    const nameMatch = normalise(c.name) === normalise(name);
    if (parentId) {
      return nameMatch && 'parentId' in c && c.parentId === parentId;
    }
    return nameMatch;
  });
}

/** Build permission overwrites for a channel from role names. */
function buildOverwrites(
  guild: Guild,
  channelTemplate: ChannelTemplate,
  category: CategoryTemplate,
  denyEveryoneSend: boolean
): OverwriteData[] {
  const overwrites: OverwriteData[] = [];

  // If category restricts view, deny @everyone
  if (category.allowView && category.allowView.length > 0) {
    const everyone = guild.roles.everyone;
    overwrites.push({
      id: everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel],
    });
    for (const roleName of category.allowView) {
      const role = findRole(guild, roleName);
      if (role) {
        overwrites.push({
          id: role.id,
          type: OverwriteType.Role,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }
    }
  }

  // Deny @everyone send if restricted channel
  if (denyEveryoneSend || (channelTemplate.denySend ?? []).includes('@everyone')) {
    const everyone = guild.roles.everyone;
    const existing = overwrites.find((o) => o.id === everyone.id);
    if (existing) {
      if (!existing.deny) existing.deny = [];
      (existing.deny as bigint[]).push(PermissionFlagsBits.SendMessages);
    } else {
      overwrites.push({
        id: everyone.id,
        type: OverwriteType.Role,
        deny: [PermissionFlagsBits.SendMessages],
      });
    }
  }

  // Allow specific roles to send
  for (const roleName of channelTemplate.allowSend ?? []) {
    const role = findRole(guild, roleName);
    if (role) {
      const existing = overwrites.find((o) => o.id === role.id);
      if (existing) {
        if (!existing.allow) existing.allow = [];
        (existing.allow as bigint[]).push(PermissionFlagsBits.SendMessages);
      } else {
        overwrites.push({
          id: role.id,
          type: OverwriteType.Role,
          allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
        });
      }
    }
  }

  // Allow specific roles to view
  for (const roleName of channelTemplate.allowView ?? []) {
    const role = findRole(guild, roleName);
    if (role) {
      const existing = overwrites.find((o) => o.id === role.id);
      if (existing) {
        if (!existing.allow) existing.allow = [];
        (existing.allow as bigint[]).push(PermissionFlagsBits.ViewChannel);
      } else {
        overwrites.push({
          id: role.id,
          type: OverwriteType.Role,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }
    }
  }

  return overwrites;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface SetupPlan {
  missingRoles: string[];
  missingCategories: string[];
  missingChannels: Array<{ name: string; category: string }>;
}

export function analyzeGuild(guild: Guild): SetupPlan {
  const missingRoles = TEMPLATE.roles
    .map((r) => r.name)
    .filter((name) => !findRole(guild, name));

  const missingCategories: string[] = [];
  const missingChannels: Array<{ name: string; category: string }> = [];

  for (const cat of TEMPLATE.categories) {
    const existingCat = findCategory(guild, cat.name);
    if (!existingCat) {
      missingCategories.push(cat.name);
    }
    for (const ch of cat.channels) {
      const parentId = existingCat?.id;
      if (!findChannel(guild, ch.name, parentId)) {
        missingChannels.push({ name: ch.name, category: cat.name });
      }
    }
  }

  return { missingRoles, missingCategories, missingChannels };
}

// ─── Execution ────────────────────────────────────────────────────────────────

export async function runSetup(guild: Guild, dryRun: boolean): Promise<SetupResult> {
  const items: SetupItem[] = [];

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  for (const roleDef of TEMPLATE.roles) {
    const existing = findRole(guild, roleDef.name);
    if (existing) {
      items.push({ type: 'role', name: roleDef.name, status: 'skipped' });
      continue;
    }
    if (dryRun) {
      items.push({ type: 'role', name: roleDef.name, status: 'created' });
      continue;
    }
    try {
      await withRetry(
        () => createRole(guild, roleDef),
        `Create role: ${roleDef.name}`
      );
      items.push({ type: 'role', name: roleDef.name, status: 'created' });
      logger.info(`Role created: ${roleDef.name}`);
    } catch (err) {
      items.push({ type: 'role', name: roleDef.name, status: 'failed', reason: String(err) });
      logger.error(`Failed to create role: ${roleDef.name}`, err);
    }
  }

  // ── 2. Categories & Channels ──────────────────────────────────────────────
  for (const catTemplate of TEMPLATE.categories) {
    let category = findCategory(guild, catTemplate.name);

    if (!category) {
      if (dryRun) {
        items.push({ type: 'category', name: catTemplate.name, status: 'created' });
        // In dry-run we still need to process channels under this category
      } else {
        try {
          category = await withRetry(
            () => createCategory(guild, catTemplate),
            `Create category: ${catTemplate.name}`
          );
          items.push({ type: 'category', name: catTemplate.name, status: 'created' });
          logger.info(`Category created: ${catTemplate.name}`);
        } catch (err) {
          items.push({
            type: 'category',
            name: catTemplate.name,
            status: 'failed',
            reason: String(err),
          });
          logger.error(`Failed to create category: ${catTemplate.name}`, err);
          // Still attempt channels even if category creation failed
        }
      }
    } else {
      items.push({ type: 'category', name: catTemplate.name, status: 'skipped' });
    }

    // Channels
    for (const chTemplate of catTemplate.channels) {
      const parentId = category?.id;
      if (findChannel(guild, chTemplate.name, parentId)) {
        items.push({ type: 'channel', name: chTemplate.name, status: 'skipped' });
        continue;
      }
      if (dryRun) {
        items.push({ type: 'channel', name: chTemplate.name, status: 'created' });
        continue;
      }
      try {
        const denyEveryoneSend = (chTemplate.denySend ?? []).includes('@everyone');
        const overwrites = buildOverwrites(
          guild,
          chTemplate,
          catTemplate,
          denyEveryoneSend
        );
        await withRetry(
          () => createChannel(guild, chTemplate, category?.id, overwrites),
          `Create channel: ${chTemplate.name}`
        );
        items.push({ type: 'channel', name: chTemplate.name, status: 'created' });
        logger.info(`Channel created: ${chTemplate.name}`);
      } catch (err) {
        items.push({
          type: 'channel',
          name: chTemplate.name,
          status: 'failed',
          reason: String(err),
        });
        logger.error(`Failed to create channel: ${chTemplate.name}`, err);
      }
    }
  }

  return { items, dryRun };
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function createRole(guild: Guild, def: RoleTemplate): Promise<Role> {
  return guild.roles.create({
    name: def.name,
    color: def.color,
    hoist: def.hoist,
    mentionable: def.mentionable,
    permissions: [...def.permissions],
    reason: 'EyesnerTTV setup',
  });
}

async function createCategory(guild: Guild, cat: CategoryTemplate): Promise<CategoryChannel> {
  return guild.channels.create({
    name: cat.name,
    type: ChannelType.GuildCategory,
    reason: 'EyesnerTTV setup',
  }) as Promise<CategoryChannel>;
}

async function createChannel(
  guild: Guild,
  ch: ChannelTemplate,
  parentId: string | undefined,
  permissionOverwrites: OverwriteData[]
): Promise<void> {
  const type = resolveChannelType(guild, ch);

  await guild.channels.create({
    name: ch.name,
    type,
    parent: parentId,
    topic: ch.type !== 'voice' ? ch.topic : undefined,
    nsfw: ch.nsfw ?? false,
    permissionOverwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
    reason: 'EyesnerTTV setup',
  });
}

type SetupChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildAnnouncement;

function resolveChannelType(guild: Guild, ch: ChannelTemplate): SetupChannelType {
  if (ch.type === 'voice') {
    return ChannelType.GuildVoice;
  }

  if (ch.type === 'announcement') {
    // Announcement/news channels require the Community feature.
    if (guild.features.includes('COMMUNITY')) {
      return ChannelType.GuildAnnouncement;
    }

    logger.warn(
      `Guild is not a Community server; creating "${ch.name}" as GuildText instead of GuildAnnouncement.`
    );
    return ChannelType.GuildText;
  }

  return ChannelType.GuildText;
}

// ─── Role hierarchy checker ───────────────────────────────────────────────────

export interface HierarchyReport {
  ok: boolean;
  issues: string[];
}

export function checkRoleHierarchy(guild: Guild): HierarchyReport {
  const issues: string[] = [];
  const botMember = guild.members.me;
  if (!botMember) {
    issues.push('Cannot determine bot member – hierarchy check skipped.');
    return { ok: false, issues };
  }

  const botHighestPosition = botMember.roles.highest.position;

  for (const roleDef of TEMPLATE.roles) {
    const role = findRole(guild, roleDef.name);
    if (!role) continue; // will be created; not yet a concern
    if (role.position >= botHighestPosition) {
      issues.push(
        `Role "${role.name}" (position ${role.position}) is at or above the bot's highest role ` +
          `(position ${botHighestPosition}). The bot cannot manage this role.`
      );
    }
  }

  return { ok: issues.length === 0, issues };
}
