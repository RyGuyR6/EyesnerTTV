/**
 * Environment variable validation and config loading.
 */
import * as dotenv from 'dotenv';
import { BotConfig } from '../types';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function optionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

export function loadConfig(): BotConfig {
  const token = requireEnv('DISCORD_TOKEN');
  const clientId = requireEnv('CLIENT_ID');
  const guildId = requireEnv('GUILD_ID');

  const rawLogLevel = optionalEnv('LOG_LEVEL', 'info');
  const validLevels = ['debug', 'info', 'warn', 'error'] as const;
  if (!validLevels.includes(rawLogLevel as (typeof validLevels)[number])) {
    throw new Error(
      `Invalid LOG_LEVEL "${rawLogLevel}". Must be one of: ${validLevels.join(', ')}`
    );
  }

  const dryRun = optionalEnv('DRY_RUN', 'false').toLowerCase() === 'true';

  return {
    token,
    clientId,
    guildId,
    logLevel: rawLogLevel as BotConfig['logLevel'],
    dryRun,
  };
}

/** Redact a token for safe logging. */
export function redactToken(token: string): string {
  if (token.length < 10) return '***';
  return token.slice(0, 6) + '...' + token.slice(-4);
}
