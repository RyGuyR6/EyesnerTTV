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

export function officialRulesEmbed(): EmbedBuilder {
  return brandEmbed()
    .setTitle('📜 Official Server Rules')
    .setDescription(
      'Welcome to the EyesnerTTV community. These rules keep chat fun, safe, and fair for everyone. ' +
        'By participating, you agree to follow them.'
    )
    .addFields(
      {
        name: '1) Respect Everyone',
        value: 'No harassment, hate speech, slurs, threats, or personal attacks.',
      },
      {
        name: '2) Keep It Clean',
        value: 'No NSFW content, extreme gore, or sexually explicit material.',
      },
      {
        name: '3) No Spam or Flooding',
        value: 'Do not spam messages, emojis, links, pings, or repeated copy-paste text.',
      },
      {
        name: '4) Stay On Topic',
        value: 'Use the correct channels and keep discussions relevant to each channel topic.',
      },
      {
        name: '5) No Scams or Malicious Links',
        value: 'No phishing, malware, fake giveaways, or suspicious downloads.',
      },
      {
        name: '6) Protect Privacy',
        value: 'Do not share personal information about yourself or others.',
      },
      {
        name: '7) Follow Discord Terms',
        value: 'All activity must comply with Discord Terms of Service and Community Guidelines.',
      },
      {
        name: '8) Listen to Staff',
        value: 'Moderator and admin decisions are final. Use respectful appeals if needed.',
      },
      {
        name: '9) Appropriate Usernames and Avatars',
        value: 'Display names and profile pictures must remain non-offensive and community-safe.',
      },
      {
        name: '10) Enforcement',
        value:
          'Rule violations may lead to warnings, mutes, kicks, or bans depending on severity and history.',
      }
    )
    .addFields({
      name: '✅ Acknowledgement',
      value: 'React or reply in welcome channels as instructed by staff to confirm you read the rules.',
    });
}

export interface StreamScheduleEmbedInput {
  title?: string;
  details: string;
  editorTag: string;
}

export function officialStreamScheduleEmbed(input: StreamScheduleEmbedInput): EmbedBuilder {
  return brandEmbed()
    .setTitle(input.title ?? '📅 Official Stream Schedule')
    .setDescription(input.details)
    .addFields(
      {
        name: '🟢 Time Zone Reminder',
        value: 'All times listed are subject to change. Watch announcements for live updates.',
      },
      {
        name: '🔔 Stay Notified',
        value: 'Enable notifications in the live and announcements channels so you do not miss a stream.',
      },
      {
        name: '🛠️ Last Updated By',
        value: input.editorTag,
      }
    );
}

export function officialWelcomeDmEmbed(guildName: string): EmbedBuilder {
  return brandEmbed()
    .setTitle(`👋 Welcome to ${guildName}`)
    .setDescription(
      'You are now part of the community. This server is built for streams, highlights, events, and good vibes.'
    )
    .addFields(
      {
        name: '📌 Start Here',
        value:
          '1) Read #welcome and #rules\n' +
          '2) Introduce yourself in #general\n' +
          '3) Check #stream-schedule for upcoming streams',
      },
      {
        name: '💬 Community Expectations',
        value:
          'Be respectful, avoid spam, and keep content in the right channels. ' +
          'Staff are here to help if you have questions.',
      },
      {
        name: '🎮 Get Involved',
        value:
          'Join discussions, share clips and highlights, and hop into voice channels during community events.',
      }
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
