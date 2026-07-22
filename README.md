# EyesnerTTV – Discord Setup Bot

> A temporary, admin-only Discord bot that builds a polished streamer community server structure in one command.

[![Validate](https://github.com/RyGuyR6/EyesnerTTV/actions/workflows/validate.yml/badge.svg)](https://github.com/RyGuyR6/EyesnerTTV/actions/workflows/validate.yml)

---

## What It Does

EyesnerTTV runs `/setup` once (or a few times) to create a complete, professionally structured Discord server for a streamer community. It:

- Creates missing **roles**, **categories**, and **channels** based on the built-in template
- **Never deletes** anything that already exists
- Shows an **interactive preview** before making any changes
- Requires **explicit confirmation** before applying changes
- Provides a **final summary** of created, skipped, and failed items
- Is **safe to run more than once**

---

## Commands

| Command    | Description |
|------------|-------------|
| `/setup`   | Interactive setup with preview, install, and cancel buttons |
| `/preview` | Show what `/setup` would create without making changes |
| `/repair`  | Recreate any missing EyesnerTTV items |
| `/update`  | Apply template updates without deleting custom channels |
| `/backup`  | Export the current server structure to JSON |
| `/help`    | Show all commands and safety guarantees |

---

## Server Structure Created

### Categories & Channels

| Category    | Channels |
|-------------|----------|
| INFORMATION | 👋・welcome, 📜・rules, 📢・announcements, 📅・stream-schedule, 🔴・live-now |
| COMMUNITY   | 💬・general, 🎮・gaming, 📸・clips-highlights, 😂・memes, 🎨・fan-art, 💡・suggestions |
| CREATOR     | 🎥・behind-the-scenes, 🗳️・community-polls, 🎉・events |
| VOICE       | 🎙️ General VC, 🎮 Gaming VC 1, 🎮 Gaming VC 2, 📺 Stream Watch Party |

### Roles (highest → lowest)

Owner → Admin → Moderator → Stream Team → VIP → Subscriber → Community Member → New Member → Bot

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/RyGuyR6/EyesnerTTV.git
cd EyesnerTTV

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in DISCORD_TOKEN, CLIENT_ID, GUILD_ID

# 4. Verify your setup
npm run doctor

# 5. Start the bot
npm run dev       # development (ts-node)
npm start         # production (compiled JS)
```

See **[MANUAL-SETUP.md](MANUAL-SETUP.md)** for the complete manual steps required in the Discord Developer Portal.

---

## Development

```bash
npm run dev       # Start in development mode (ts-node)
npm run build     # Compile TypeScript → dist/
npm start         # Run compiled output
npm run lint      # ESLint
npm run test      # Jest tests
npm run doctor    # Validate environment config
npm run validate  # lint + build + test
```

---

## Security

- Secrets are **never logged** (tokens are redacted)
- Environment variables are **validated on startup**
- The bot uses **least-privilege permissions**
- All admin commands are restricted to **Administrator** permission
- `/setup` requires **explicit confirmation** before making changes
- Dry-run mode available via `DRY_RUN=true` in `.env`

---

## Architecture

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full technical design.

---

## License

MIT