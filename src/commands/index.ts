/**
 * Command registry – all slash commands are registered here.
 */
import { Collection } from 'discord.js';
import { BotCommand } from '../types';
import { setup } from './setup';
import { preview } from './preview';
import { repair } from './repair';
import { update } from './update';
import { backup } from './backup';
import { help } from './help';

export const commands = new Collection<string, BotCommand>([
  [setup.data.name, setup],
  [preview.data.name, preview],
  [repair.data.name, repair],
  [update.data.name, update],
  [backup.data.name, backup],
  [help.data.name, help],
]);
