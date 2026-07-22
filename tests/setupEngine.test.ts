/**
 * Tests for the setup engine: duplicate detection, dry-run, role hierarchy,
 * permission checks, and safe reruns.
 */
import {
  analyzeGuild,
  runSetup,
  checkRoleHierarchy,
  SetupPlan,
} from '../src/utils/setupEngine';
import { TEMPLATE } from '../src/config/template';

// ─── Minimal Guild Mock ────────────────────────────────────────────────────────

function makeRole(name: string, position = 5): Record<string, unknown> {
  return { name, position, id: `role-${name}` };
}

function makeChannel(name: string, type: number, parentId: string | null = null): Record<string, unknown> {
  return { name, type, id: `ch-${name}`, parentId };
}

function buildGuildMock(
  roles: Record<string, unknown>[] = [],
  channels: Record<string, unknown>[] = [],
  botHighestPosition = 10,
  botMemberPresent = true
): Record<string, unknown> {
  const roleCache = new Map(roles.map((r) => [r['id'] as string, r]));
  const channelCache = new Map(channels.map((c) => [c['id'] as string, c]));

  const botMember = botMemberPresent
    ? { roles: { highest: { position: botHighestPosition } } }
    : null;

  return {
    id: 'guild-123',
    ownerId: 'owner-456',
    members: { me: botMember },
    roles: {
      cache: {
        find: (fn: (r: unknown) => boolean) => [...roleCache.values()].find(fn),
        filter: (fn: (r: unknown) => boolean) => [...roleCache.values()].filter(fn),
        everyone: makeRole('@everyone', 0),
      },
    },
    channels: {
      cache: {
        find: (fn: (c: unknown) => boolean) => [...channelCache.values()].find(fn),
        some: (fn: (c: unknown) => boolean) => [...channelCache.values()].some(fn),
        filter: (fn: (c: unknown) => boolean) => ({
          sort: () => ({
            map: (m: (c: unknown) => unknown) =>
              [...channelCache.values()].filter(fn).map(m),
          }),
          map: (m: (c: unknown) => unknown) => [...channelCache.values()].filter(fn).map(m),
        }),
      },
    },
  };
}

// ─── analyzeGuild ──────────────────────────────────────────────────────────────

describe('analyzeGuild – duplicate detection', () => {
  it('reports all items as missing when guild is empty', () => {
    const guild = buildGuildMock();
    const plan: SetupPlan = analyzeGuild(guild as never);

    expect(plan.missingRoles.length).toBe(TEMPLATE.roles.length);
    expect(plan.missingCategories.length).toBe(TEMPLATE.categories.length);

    const totalTemplateChannels = TEMPLATE.categories.reduce(
      (acc, cat) => acc + cat.channels.length,
      0
    );
    expect(plan.missingChannels.length).toBe(totalTemplateChannels);
  });

  it('skips roles that already exist (case-insensitive)', () => {
    const existingRoles = [
      makeRole('owner'),   // same as 'Owner' normalised
      makeRole('Admin'),
    ];
    const guild = buildGuildMock(existingRoles);
    const plan: SetupPlan = analyzeGuild(guild as never);

    expect(plan.missingRoles).not.toContain('Owner');
    expect(plan.missingRoles).not.toContain('Admin');
    expect(plan.missingRoles).toContain('Moderator');
  });

  it('skips categories that already exist', () => {
    const existingChannels = [
      { ...makeChannel('INFORMATION', 4 /* GuildCategory */), id: 'cat-info' },
    ];
    const guild = buildGuildMock([], existingChannels);
    const plan: SetupPlan = analyzeGuild(guild as never);

    expect(plan.missingCategories).not.toContain('INFORMATION');
  });
});

// ─── runSetup (dry-run) ────────────────────────────────────────────────────────

describe('runSetup – dry-run mode', () => {
  it('marks all items as created without calling real API', async () => {
    const guild = buildGuildMock();
    const result = await runSetup(guild as never, true);

    expect(result.dryRun).toBe(true);
    // Every item should be 'created' (dry-run), none 'failed'
    const failed = result.items.filter((i) => i.status === 'failed');
    expect(failed).toHaveLength(0);

    const created = result.items.filter((i) => i.status === 'created');
    expect(created.length).toBeGreaterThan(0);
  });

  it('skips items that already exist even in dry-run', async () => {
    const existingRoles = TEMPLATE.roles.map((r) => makeRole(r.name));
    const guild = buildGuildMock(existingRoles);
    const result = await runSetup(guild as never, true);

    const skippedRoles = result.items.filter(
      (i) => i.type === 'role' && i.status === 'skipped'
    );
    expect(skippedRoles.length).toBe(TEMPLATE.roles.length);
  });

  it('does not make any API calls in dry-run', async () => {
    const guild = buildGuildMock();
    // In dry-run the guild mock has no 'create' methods – if the engine tried to call
    // guild.roles.create() it would throw. This ensures no real calls happen.
    await expect(runSetup(guild as never, true)).resolves.not.toThrow();
  });
});

// ─── runSetup – safe rerun ─────────────────────────────────────────────────────

describe('runSetup – safe reruns', () => {
  it('skips all items when guild already has everything', async () => {
    const existingRoles = TEMPLATE.roles.map((r) => makeRole(r.name));
    // Build existing channels for all template channels
    const existingChannels: Record<string, unknown>[] = [];
    TEMPLATE.categories.forEach((cat) => {
      const catId = `cat-${cat.name}`;
      existingChannels.push({ id: catId, name: cat.name, type: 4, parentId: null });
      cat.channels.forEach((ch) => {
        existingChannels.push({ id: `ch-${ch.name}`, name: ch.name, type: 0, parentId: catId });
      });
    });

    const guild = buildGuildMock(existingRoles, existingChannels);
    const result = await runSetup(guild as never, true);

    const created = result.items.filter((i) => i.status === 'created');
    expect(created).toHaveLength(0);
  });
});

// ─── checkRoleHierarchy ────────────────────────────────────────────────────────

describe('checkRoleHierarchy', () => {
  it('returns ok=true when bot is above all template roles', () => {
    const existingRoles = TEMPLATE.roles.map((r, i) => makeRole(r.name, i + 1));
    const guild = buildGuildMock(existingRoles, [], 20);
    const report = checkRoleHierarchy(guild as never);
    expect(report.ok).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('reports issues when template roles are above the bot', () => {
    const existingRoles = TEMPLATE.roles.map((r) => makeRole(r.name, 50)); // all above bot
    const guild = buildGuildMock(existingRoles, [], 10);
    const report = checkRoleHierarchy(guild as never);
    expect(report.ok).toBe(false);
    expect(report.issues.length).toBeGreaterThan(0);
  });

  it('returns ok=false when bot member is not present', () => {
    const guild = buildGuildMock([], [], 10, false);
    const report = checkRoleHierarchy(guild as never);
    expect(report.ok).toBe(false);
  });
});
