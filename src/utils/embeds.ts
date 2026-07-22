/**
 * Shared embed builders for consistent EyesnerTTV branding.
 */
import { EmbedBuilder } from 'discord.js';
import { SetupItem, SetupResult } from '../types';

// Dark streamer theme accent color
const BRAND_COLOR = 0x7289da; // Discord blurple-ish
const SUCCESS_COLOR = 0x2ecc71;
const ERROR_COLOR = 0xe74c3c;
const WARN_COLOR = 0xe67e22;
const INFO_COLOR = 0x3498db;

export function brandEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setFooter({ text: 'EyesnerTTV Setup Bot' })
    .setTimestamp();
}

export function successEmbed(title: string, description: string): EmbedBuilder {
  return brandEmbed().setColor(SUCCESS_COLOR).setTitle(`✅ ${title}`).setDescription(description);
}

export function errorEmbed(title: string, description: string): EmbedBuilder {
  return brandEmbed().setColor(ERROR_COLOR).setTitle(`❌ ${title}`).setDescription(description);
}

export function warnEmbed(title: string, description: string): EmbedBuilder {
  return brandEmbed().setColor(WARN_COLOR).setTitle(`⚠️ ${title}`).setDescription(description);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return brandEmbed().setColor(INFO_COLOR).setTitle(`ℹ️ ${title}`).setDescription(description);
}

export function previewEmbed(
  rolesToCreate: string[],
  categoriesToCreate: string[],
  channelsToCreate: string[],
  dryRun: boolean
): EmbedBuilder {
  const lines: string[] = [];

  if (rolesToCreate.length === 0 && categoriesToCreate.length === 0 && channelsToCreate.length === 0) {
    lines.push('**Everything is already in place.** No changes needed.');
  } else {
    if (rolesToCreate.length > 0) {
      lines.push('**Roles to create:**');
      rolesToCreate.forEach((r) => lines.push(`  🔹 ${r}`));
      lines.push('');
    }
    if (categoriesToCreate.length > 0) {
      lines.push('**Categories to create:**');
      categoriesToCreate.forEach((c) => lines.push(`  📁 ${c}`));
      lines.push('');
    }
    if (channelsToCreate.length > 0) {
      lines.push('**Channels to create:**');
      channelsToCreate.forEach((ch) => lines.push(`  📌 ${ch}`));
    }
  }

  const title = dryRun ? 'Dry-Run Preview' : 'Setup Preview';
  return brandEmbed()
    .setColor(INFO_COLOR)
    .setTitle(`🔍 ${title}`)
    .setDescription(lines.join('\n') || 'No changes to preview.')
    .addFields({
      name: dryRun ? '🧪 Dry-Run Mode' : '⚡ Ready to Install',
      value: dryRun
        ? 'This is a simulation. No real changes will be made.'
        : 'Click **Install** to apply the changes.',
    });
}

export function summaryEmbed(result: SetupResult): EmbedBuilder {
  const created = result.items.filter((i) => i.status === 'created');
  const skipped = result.items.filter((i) => i.status === 'skipped');
  const failed = result.items.filter((i) => i.status === 'failed');

  const lines: string[] = [];

  if (created.length) {
    lines.push(`**✅ Created (${created.length}):**`);
    created.forEach((i) => lines.push(`  ${typeIcon(i)} ${i.name}`));
    lines.push('');
  }
  if (skipped.length) {
    lines.push(`**⏭️ Skipped (${skipped.length}):**`);
    skipped.forEach((i) => lines.push(`  ${typeIcon(i)} ${i.name} – already exists`));
    lines.push('');
  }
  if (failed.length) {
    lines.push(`**❌ Failed (${failed.length}):**`);
    failed.forEach((i) => lines.push(`  ${typeIcon(i)} ${i.name} – ${i.reason ?? 'unknown error'}`));
  }

  const color = failed.length > 0 ? WARN_COLOR : SUCCESS_COLOR;
  const title = result.dryRun ? 'Dry-Run Complete' : 'Setup Complete';

  return brandEmbed()
    .setColor(color)
    .setTitle(`🎉 ${title}`)
    .setDescription(lines.join('\n') || 'No items processed.')
    .addFields(
      { name: '✅ Created', value: String(created.length), inline: true },
      { name: '⏭️ Skipped', value: String(skipped.length), inline: true },
      { name: '❌ Failed', value: String(failed.length), inline: true }
    );
}

function typeIcon(item: SetupItem): string {
  switch (item.type) {
    case 'role':
      return '🔹';
    case 'category':
      return '📁';
    case 'channel':
      return '📌';
  }
}
