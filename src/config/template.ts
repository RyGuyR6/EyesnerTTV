/**
 * EyesnerTTV Streamer Community – Default server template.
 *
 * Colors use Discord's supported palette (hex as integers).
 * Permissions follow least-privilege principles.
 */
import { PermissionFlagsBits } from 'discord.js';
import { ServerTemplate } from '../types';

// Readable permission aliases
const {
  ViewChannel,
  SendMessages,
  ReadMessageHistory,
  UseApplicationCommands,
  EmbedLinks,
  AttachFiles,
  AddReactions,
  CreatePublicThreads,
  SendMessagesInThreads,
  ManageMessages,
  MuteMembers,
  DeafenMembers,
  MoveMembers,
  Connect,
  Speak,
  UseVAD,
  MentionEveryone,
  ManageChannels,
  ManageRoles,
  BanMembers,
  KickMembers,
  ManageGuild,
  Administrator,
} = PermissionFlagsBits;

// ─── Role Definitions ──────────────────────────────────────────────────────────
// Higher position number → higher in the hierarchy (owner is highest).

const ROLES = [
  {
    name: 'Owner',
    color: 0xe74c3c,
    hoist: true,
    mentionable: false,
    position: 9,
    permissions: [Administrator],
  },
  {
    name: 'Admin',
    color: 0xe67e22,
    hoist: true,
    mentionable: false,
    position: 8,
    permissions: [
      ManageGuild,
      ManageChannels,
      ManageRoles,
      BanMembers,
      KickMembers,
      ManageMessages,
      MuteMembers,
      DeafenMembers,
      MoveMembers,
      MentionEveryone,
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      UseApplicationCommands,
    ],
  },
  {
    name: 'Moderator',
    color: 0x3498db,
    hoist: true,
    mentionable: false,
    position: 7,
    permissions: [
      ManageMessages,
      KickMembers,
      MuteMembers,
      DeafenMembers,
      MoveMembers,
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      UseApplicationCommands,
    ],
  },
  {
    name: 'Stream Team',
    color: 0x9b59b6,
    hoist: true,
    mentionable: true,
    position: 6,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      UseApplicationCommands,
      MentionEveryone,
    ],
  },
  {
    name: 'VIP',
    color: 0xf1c40f,
    hoist: true,
    mentionable: true,
    position: 5,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      CreatePublicThreads,
      SendMessagesInThreads,
      UseApplicationCommands,
    ],
  },
  {
    name: 'Subscriber',
    color: 0x1abc9c,
    hoist: false,
    mentionable: true,
    position: 4,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      CreatePublicThreads,
      SendMessagesInThreads,
      UseApplicationCommands,
    ],
  },
  {
    name: 'Community Member',
    color: 0x95a5a6,
    hoist: false,
    mentionable: false,
    position: 3,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      AddReactions,
      CreatePublicThreads,
      SendMessagesInThreads,
      UseApplicationCommands,
    ],
  },
  {
    name: 'New Member',
    color: 0x7f8c8d,
    hoist: false,
    mentionable: false,
    position: 2,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      AddReactions,
      UseApplicationCommands,
    ],
  },
  {
    name: 'Bot',
    color: 0x2c3e50,
    hoist: false,
    mentionable: false,
    position: 1,
    permissions: [
      ViewChannel,
      SendMessages,
      ReadMessageHistory,
      EmbedLinks,
      AttachFiles,
      ManageMessages,
      MuteMembers,
      DeafenMembers,
      MoveMembers,
      Connect,
      Speak,
      UseVAD,
      UseApplicationCommands,
      ManageChannels,
      ManageRoles,
    ],
  },
] as const;

// ─── Channel Templates ─────────────────────────────────────────────────────────

/** Roles that can post in announcement/restricted channels. */
const STAFF_POSTER_ROLES = ['Owner', 'Admin', 'Moderator', 'Stream Team'];

export const TEMPLATE: ServerTemplate = {
  name: 'EyesnerTTV Streamer Community',
  roles: ROLES.map((r) => ({ ...r })),
  categories: [
    {
      name: 'INFORMATION',
      channels: [
        {
          name: '👋・welcome',
          type: 'text',
          topic: 'Welcome to the community! Read the rules before chatting.',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '📜・rules',
          type: 'text',
          topic: 'Server rules – please read before participating.',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '📢・announcements',
          type: 'announcement',
          topic: 'Official server announcements.',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '📅・stream-schedule',
          type: 'text',
          topic: 'Stream schedule – check here for upcoming streams.',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '🌐・socials',
          type: 'text',
          topic:
            'Official links: Twitch https://twitch.tv/eyesner/home | TikTok https://www.tiktok.com/@eyesner?_r=1&_t=ZT-98Fim1fViWc',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '🔴・live-now',
          type: 'text',
          topic: 'Live stream notifications.',
          denySend: ['@everyone'],
          allowSend: STAFF_POSTER_ROLES,
        },
      ],
    },
    {
      name: 'COMMUNITY',
      channels: [
        {
          name: '💬・general',
          type: 'text',
          topic: 'General chat – be respectful and have fun!',
        },
        {
          name: '🎮・gaming',
          type: 'text',
          topic: 'Talk about your favourite games.',
        },
        {
          name: '📸・clips-highlights',
          type: 'text',
          topic: 'Share your best clips and highlights.',
        },
        {
          name: '😂・memes',
          type: 'text',
          topic: 'Keep it clean and keep it funny.',
        },
        {
          name: '🎨・fan-art',
          type: 'text',
          topic: 'Share your artwork and fan creations.',
        },
        {
          name: '💡・suggestions',
          type: 'text',
          topic: 'Have an idea? Share it here.',
        },
      ],
    },
    {
      name: 'CREATOR',
      allowView: [...STAFF_POSTER_ROLES, 'VIP', 'Subscriber'],
      channels: [
        {
          name: '🎥・behind-the-scenes',
          type: 'text',
          topic: 'Exclusive behind-the-scenes content for subscribers and VIPs.',
          allowSend: STAFF_POSTER_ROLES,
        },
        {
          name: '🗳️・community-polls',
          type: 'text',
          topic: 'Vote on community decisions.',
        },
        {
          name: '🎉・events',
          type: 'text',
          topic: 'Upcoming events and giveaways.',
          allowSend: STAFF_POSTER_ROLES,
        },
      ],
    },
    {
      name: 'VOICE',
      channels: [
        { name: '🎙️ General VC', type: 'voice' },
        { name: '🎮 Gaming VC 1', type: 'voice' },
        { name: '🎮 Gaming VC 2', type: 'voice' },
        { name: '📺 Stream Watch Party', type: 'voice' },
      ],
    },
  ],
};
