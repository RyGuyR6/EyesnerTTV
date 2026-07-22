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
import { rules } from './rules';
import { schedule } from './schedule';
import { socials } from './socials';

export const commands = new Collection<string, BotCommand>([
  [setup.data.name, setup],
  [preview.data.name, preview],
  [repair.data.name, repair],
  [update.data.name, update],
  [backup.data.name, backup],
  [rules.data.name, rules],
  [schedule.data.name, schedule],
  [socials.data.name, socials],
  [help.data.name, help],
]);
