/**
 * Simple structured logger.
 * Secrets are never included in log output.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function format(level: LogLevel, message: string): string {
  const ts = new Date().toISOString();
  const color = COLORS[level];
  const tag = `[${level.toUpperCase()}]`.padEnd(7);
  return `${color}${ts} ${tag}${RESET} ${message}`;
}

export const logger = {
  debug(message: string): void {
    if (shouldLog('debug')) console.debug(format('debug', message));
  },
  info(message: string): void {
    if (shouldLog('info')) console.info(format('info', message));
  },
  warn(message: string): void {
    if (shouldLog('warn')) console.warn(format('warn', message));
  },
  error(message: string, err?: unknown): void {
    if (!shouldLog('error')) return;
    if (err instanceof Error) {
      console.error(format('error', `${message}: ${err.message}`));
    } else {
      console.error(format('error', message));
    }
  },
};
