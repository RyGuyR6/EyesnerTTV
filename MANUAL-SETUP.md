# MANUAL-SETUP.md – Discord Developer Portal Steps

This file explains every manual step you must complete in the Discord Developer Portal and Discord client. **The bot cannot do any of this for you.**

---

## Why You Must Do This Manually

The bot **cannot**:
- Create its own Discord application
- Retrieve its own token
- Invite itself to a server
- Bypass Discord's authorization system
- Change roles that are positioned above its own highest role in the hierarchy

---

## Step 1 – Create a Discord Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** (top-right)
3. Name it **EyesnerTTV**
4. Click **Create**

---

## Step 2 – Add a Bot User

1. In the left sidebar, click **Bot**
2. Click **Add Bot** → **Yes, do it!**
3. Under **Username**, name the bot **EyesnerTTV** (or leave the default)
4. Optionally upload a profile picture

---

## Step 3 – Copy the Application (Client) ID

1. In the left sidebar, click **General Information**
2. Find **Application ID**
3. Click **Copy**
4. Save this value – you will add it to `.env` as `CLIENT_ID`

---

## Step 4 – Generate the Bot Token

1. In the left sidebar, click **Bot**
2. Under the bot username, click **Reset Token** → **Yes, do it!**
3. Click **Copy** to copy the token
4. **Save it immediately** – you will not be able to see it again after leaving the page
5. Add it to `.env` as `DISCORD_TOKEN`

> ⚠️ **Never share your token.** Anyone with it can control your bot. If it leaks, reset it immediately.

---

## Step 5 – Enable Required Gateway Intents

Still on the **Bot** page:

1. Scroll down to **Privileged Gateway Intents**
2. Enable:
   - ✅ **Server Members Intent** *(optional, not strictly required but recommended)*
   - ✅ **Message Content Intent** *(not required by EyesnerTTV – leave off unless you add message commands later)*
3. Click **Save Changes**

> EyesnerTTV uses the `GUILDS` and `GUILD_MESSAGES` intents only. You do **not** need `MESSAGE_CONTENT` for slash commands.

---

## Step 6 – Configure OAuth2 Scopes

1. In the left sidebar, click **OAuth2** → **URL Generator**
2. Under **Scopes**, check:
   - ✅ `bot`
   - ✅ `applications.commands`

---

## Step 7 – Select Bot Permissions

After checking the scopes above, a **Bot Permissions** panel will appear below. Check:

| Permission | Why |
|---|---|
| Manage Roles | Create and configure roles |
| Manage Channels | Create categories and channels |
| View Channels | Read server structure |
| Send Messages | Reply to commands |
| Embed Links | Send rich embed responses |
| Attach Files | Send backup JSON file |
| Read Message History | Access channel history |
| Manage Messages | Pin messages / moderate |
| Mute Members | Moderator tools |
| Deafen Members | Moderator tools |
| Move Members | Voice channel management |
| Use Application Commands | Register and respond to slash commands |

> ❌ Do **not** grant **Administrator** unless you have a specific need. EyesnerTTV is designed to work with the above set of permissions only.

---

## Step 8 – Generate the Invite URL

1. After selecting scopes and permissions, copy the generated URL at the bottom of the OAuth2 URL Generator page

---

## Step 9 – Invite the Bot to Your Server

1. Paste the invite URL into your browser
2. Select your target server from the dropdown
3. Click **Authorize**
4. Complete the CAPTCHA if prompted

---

## Step 10 – Enable Developer Mode in Discord

1. Open Discord
2. Click **User Settings** (gear icon, bottom-left)
3. Click **Advanced**
4. Enable **Developer Mode**

Developer Mode allows you to right-click servers, channels, and users to copy their IDs.

---

## Step 11 – Copy Your Server (Guild) ID

1. Right-click your server icon in the server list
2. Click **Copy Server ID**
3. Add it to `.env` as `GUILD_ID`

---

## Step 12 – Fill In Your `.env` File

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_guild_id_here
LOG_LEVEL=info
DRY_RUN=false
```

---

## Step 13 – Start the Bot

```bash
# Install dependencies (first time only)
npm install

# Verify your configuration
npm run doctor

# Start the bot
npm run dev       # development mode
# or
npm start         # production mode (after npm run build)
```

The bot will:
1. Validate your environment variables
2. Register slash commands with your guild
3. Log in and print: `✅ Logged in as EyesnerTTV#XXXX`

---

## Step 14 – Run /setup in Discord

1. Go to your Discord server
2. In any channel where the bot has permission to read, type `/setup`
3. Review the preview embed
4. Click **Install** to apply the server structure
5. Confirm the installation when prompted
6. Wait for the final summary

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Missing required environment variable` | Check your `.env` file. Run `npm run doctor`. |
| Commands not showing in Discord | Wait up to 1 hour for guild commands to propagate, or check CLIENT_ID and GUILD_ID. |
| `Missing Permissions` error | Ensure the bot's role is positioned **above** the roles it needs to manage. |
| Bot cannot manage a role | The role is higher than the bot's highest role. Move the bot's role up in Server Settings → Roles. |
| Token Invalid | Reset the token in the Developer Portal and update `.env`. |
