/**
 * Doctor script – validates that the environment is correctly configured.
 * Run with: npm run doctor
 */
import { loadConfig, redactToken } from '../src/config/env';
import { logger } from '../src/utils/logger';

function check(label: string, value: string | boolean, hint?: string): boolean {
  if (!value || value === 'false') {
    logger.error(`  ✗ ${label}${hint ? ` – ${hint}` : ''}`);
    return false;
  }
  logger.info(`  ✓ ${label}`);
  return true;
}

async function main(): Promise<void> {
  logger.info('🩺 EyesnerTTV Doctor – checking configuration…\n');

  let ok = true;

  try {
    const config = loadConfig();

    logger.info('Environment Variables:');
    ok = check('DISCORD_TOKEN', config.token, 'Add to .env') && ok;
    ok = check('CLIENT_ID', config.clientId, 'Add to .env') && ok;
    ok = check('GUILD_ID', config.guildId, 'Add to .env') && ok;

    logger.info('\nConfig:');
    logger.info(`  Log level : ${config.logLevel}`);
    logger.info(`  Dry-run   : ${config.dryRun}`);
    logger.info(`  Token     : ${redactToken(config.token)}`);
  } catch (err) {
    logger.error('Configuration error', err);
    ok = false;
  }

  logger.info('');
  if (ok) {
    logger.info('✅ All checks passed. You are ready to start the bot.');
  } else {
    logger.error('❌ Some checks failed. Fix the issues above, then run npm run doctor again.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
