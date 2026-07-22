/**
 * Tests for environment config loading and validation.
 */
import { loadConfig, redactToken } from '../src/config/env';

describe('loadConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws when DISCORD_TOKEN is missing', () => {
    delete process.env['DISCORD_TOKEN'];
    process.env['CLIENT_ID'] = 'client123';
    process.env['GUILD_ID'] = 'guild123';
    expect(() => loadConfig()).toThrow('DISCORD_TOKEN');
  });

  it('throws when CLIENT_ID is missing', () => {
    process.env['DISCORD_TOKEN'] = 'token123';
    delete process.env['CLIENT_ID'];
    process.env['GUILD_ID'] = 'guild123';
    expect(() => loadConfig()).toThrow('CLIENT_ID');
  });

  it('throws when GUILD_ID is missing', () => {
    process.env['DISCORD_TOKEN'] = 'token123';
    process.env['CLIENT_ID'] = 'client123';
    delete process.env['GUILD_ID'];
    expect(() => loadConfig()).toThrow('GUILD_ID');
  });

  it('returns valid config with all env vars set', () => {
    process.env['DISCORD_TOKEN'] = 'mytoken';
    process.env['CLIENT_ID'] = 'myclient';
    process.env['GUILD_ID'] = 'myguild';
    process.env['LOG_LEVEL'] = 'debug';
    process.env['DRY_RUN'] = 'true';

    const config = loadConfig();
    expect(config.token).toBe('mytoken');
    expect(config.clientId).toBe('myclient');
    expect(config.guildId).toBe('myguild');
    expect(config.logLevel).toBe('debug');
    expect(config.dryRun).toBe(true);
  });

  it('defaults LOG_LEVEL to info and DRY_RUN to false', () => {
    process.env['DISCORD_TOKEN'] = 'token';
    process.env['CLIENT_ID'] = 'client';
    process.env['GUILD_ID'] = 'guild';
    delete process.env['LOG_LEVEL'];
    delete process.env['DRY_RUN'];

    const config = loadConfig();
    expect(config.logLevel).toBe('info');
    expect(config.dryRun).toBe(false);
  });

  it('throws for an invalid LOG_LEVEL', () => {
    process.env['DISCORD_TOKEN'] = 'token';
    process.env['CLIENT_ID'] = 'client';
    process.env['GUILD_ID'] = 'guild';
    process.env['LOG_LEVEL'] = 'verbose';

    expect(() => loadConfig()).toThrow('LOG_LEVEL');
  });
});

describe('redactToken', () => {
  it('redacts all but the first 6 and last 4 characters', () => {
    const result = redactToken('abcdefghij1234');
    expect(result).toBe('abcdef...1234');
  });

  it('returns *** for very short tokens', () => {
    expect(redactToken('abc')).toBe('***');
  });
});
