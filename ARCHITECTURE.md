# ARCHITECTURE.md – EyesnerTTV Technical Design

## Overview

EyesnerTTV is a single-guild Discord setup bot written in TypeScript on top of [discord.js](https://discord.js.org/) v14. It is designed to be run temporarily (not 24/7) by a server owner to establish a polished streamer community structure.

---

## Project Structure

```
EyesnerTTV/
├── src/
│   ├── index.ts                  # Entry point: loads config, deploys commands, starts client
│   ├── commands/
│   │   ├── index.ts              # Command registry (discord.js Collection)
│   │   ├── setup.ts              # /setup – interactive install with buttons
│   │   ├── preview.ts            # /preview – read-only analysis
│   │   ├── repair.ts             # /repair – recreate missing items
│   │   ├── update.ts             # /update – apply template updates
│   │   ├── backup.ts             # /backup – export server structure to JSON
│   │   └── help.ts               # /help – command reference
│   ├── config/
│   │   ├── env.ts                # Environment variable validation
│   │   └── template.ts           # Server template definition
│   ├── utils/
│   │   ├── setupEngine.ts        # Core logic: analyze + apply template
│   │   ├── embeds.ts             # Branded EmbedBuilder helpers
│   │   ├── logger.ts             # Structured logger with level filtering
│   │   ├── rateLimit.ts          # Rate-limit-aware retry helper
│   │   └── deploy.ts             # Slash command registration
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces
├── tests/
│   ├── config.test.ts            # Config validation tests
│   └── setupEngine.test.ts       # Engine: duplicate detection, dry-run, hierarchy
├── scripts/
│   └── doctor.ts                 # Environment health check
├── .github/
│   └── workflows/
│       └── validate.yml          # CI: lint + build + test
├── .env.example
├── .eslintrc.json
├── .gitignore
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── MANUAL-SETUP.md
└── ARCHITECTURE.md
```

---

## Key Design Decisions

### Non-destructive by Default
The bot **never deletes** channels, roles, messages, or permissions. Every operation first checks for existence and skips if found.

### Modular Commands
Each command is a self-contained module that exports a `BotCommand` object implementing a shared interface:
```ts
interface BotCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;
}
```

### Template-Driven Setup
The entire server structure is defined in `src/config/template.ts` as a plain `ServerTemplate` object. This makes it trivial to update the template without touching any command logic.

### Setup Engine (setupEngine.ts)
Three exported functions drive all guild operations:

| Function | Purpose |
|---|---|
| `analyzeGuild(guild)` | Returns `SetupPlan` – lists of missing roles/categories/channels |
| `runSetup(guild, dryRun)` | Creates missing items; returns `SetupResult` with per-item status |
| `checkRoleHierarchy(guild)` | Reports roles the bot cannot manage due to position |

### Rate-Limit Awareness
All Discord API calls go through `withRetry()` in `rateLimit.ts`, which:
- Waits 500 ms between operations
- Detects HTTP 429 responses and sleeps for `retry_after` seconds
- Retries up to 3 times per operation
- Does NOT abort the entire setup if one item fails

### Dry-Run Mode
Set `DRY_RUN=true` in `.env` to enable global dry-run, or click **Preview Only** in `/setup`. In dry-run mode:
- No Discord API create calls are made
- All items that would be created are marked as `'created'` in the result
- Items that already exist are still skipped correctly

---

## Security Model

| Concern | Implementation |
|---|---|
| Secret exposure | Tokens are redacted in all log output |
| Env validation | `loadConfig()` throws on startup if required vars are missing |
| Least privilege | Bot uses no Administrator permission; each operation uses the minimum required permission |
| Command access | All admin commands use `setDefaultMemberPermissions(Administrator)` |
| Confirmation | `/setup` requires two-step button confirmation before applying real changes |
| Role hierarchy | `checkRoleHierarchy()` detects and reports roles the bot cannot manage |

---

## Data Flow – /setup Command

```
User runs /setup
    │
    ▼
Permission check (owner or Administrator)
    │
    ▼
analyzeGuild() → SetupPlan
    │
    ▼
previewEmbed() displayed with Install / Preview / Cancel buttons
    │
    ├─ Cancel → exit
    ├─ Preview Only → runSetup(guild, dryRun=true) → summaryEmbed()
    └─ Install → Confirmation prompt
                    │
                    ├─ No → exit
                    └─ Yes → runSetup(guild, dryRun=false) → summaryEmbed()
```

---

## Discord Gateway Intents Used

| Intent | Reason |
|---|---|
| `GUILDS` | Access guild, channel, and role data |
| `GUILD_MESSAGES` | Receive slash command interactions |

No message content intent is required (slash commands do not need it).

---

## Testing Strategy

Tests are in `tests/` and use **Jest** + **ts-jest** with guild mocks (no real Discord API calls).

| Test File | Coverage |
|---|---|
| `config.test.ts` | Env validation, token redaction, defaults |
| `setupEngine.test.ts` | Duplicate detection, dry-run, safe rerun, role hierarchy |

Run tests with `npm test`.
