# AuthlyX Discord Bot - Self-Hosted

A self-hosted Discord bot that lets you manage your AuthlyX app directly from Discord using slash commands. Requires an **Elite Key** from your AuthlyX dashboard.

---

## Requirements

- Node.js v18 or higher
- A Discord bot token ([discord.com/developers](https://discord.com/developers/applications))
- An AuthlyX Elite Key

---

## Setup

**1. Install dependencies**
```
npm install
```

**2. Configure environment**

Copy `.env.example` to `.env` and fill in your values:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
AUTHLYX_ELITE_KEY=your_elite_key
AUTHLYX_API_BASE=https://authly.cc
ALLOWED_ROLE=Admin
EPHEMERAL=true
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot's token from the Discord developer portal |
| `DISCORD_CLIENT_ID` | Your bot's application/client ID |
| `AUTHLYX_ELITE_KEY` | Elite Key from your AuthlyX dashboard |
| `AUTHLYX_API_BASE` | AuthlyX API base URL - do not change unless self-hosting the panel |
| `ALLOWED_ROLE` | Role name or ID that can use bot commands (e.g. `Admin`, `Staff`, or a role ID). Leave blank to allow everyone. |
| `EPHEMERAL` | `true` = replies only visible to the user who ran the command. `false` = replies visible to the whole channel. Can also be changed per-server with `/config ephemeral`. |

**3. Register slash commands with Discord**
```
npm run deploy
```

**4. Start the bot**
```
npm start
```

---

## Commands

### `/app`

| Subcommand | Description |
|---|---|
| `/app select` | Shows all your AuthlyX apps as buttons. Click one to set it as your active app. |
| `/app current` | Show which app is currently selected for your user. |

Each Discord user's app selection is saved separately, so multiple people can work with different apps in the same server.

---

### `/user`

| Subcommand | Options | Description |
|---|---|---|
| `/user add` | `username` `password` `subscription` `days` `email` `device_limit` | Create a new user. Subscription options are autocompleted. Credentials are sent to your DMs. |
| `/user view` | `username` | View a user's details, status, IP address, expiry, subscription, and linked license. |
| `/user delete` | `username` | Permanently delete a user. |
| `/user ban` | `username` | Ban a user from authenticating. |
| `/user unban` | `username` | Remove a ban from a user. |
| `/user pause` | `username` | Temporarily pause a user's access. |
| `/user unpause` | `username` | Resume a paused user's access. |
| `/user extend` | `username` `days` | Add days to a user's expiry. |
| `/user shorten` | `username` `days` | Remove days from a user's expiry. |
| `/user change-password` | `username` `new_password` | Set a new password for a user. |
| `/user reset` | `username` | Reset HWID and IP address for a user, allowing them to re-authenticate from any device. |
| `/user verify-password` | `username` `password` | Check if a username and password combination is valid. |

---

### `/license`

| Subcommand | Options | Description |
|---|---|---|
| `/license add` | `key` `subscription` `days` `device_limit` `note` | Add a license with a specific key you provide. |
| `/license generate` | `subscription` `days` `amount` `device_limit` `random_chars` `note` | Generate one or more random license keys (up to 50 at a time). Keys are sent to your DMs. |
| `/license view` | `key` | View a license's details, subscription, expiry, device usage, IP address, and status. |
| `/license delete` | `key` | Permanently delete a license. |
| `/license ban` | `key` | Ban a license key from being used. |
| `/license unban` | `key` | Remove a ban from a license. |
| `/license pause` | `key` | Temporarily disable a license. |
| `/license unpause` | `key` | Re-enable a paused license. |
| `/license extend` | `key` `days` | Add days to a license's expiry. |
| `/license shorten` | `key` `days` | Remove days from a license's expiry. |
| `/license edit` | `key` `note` `device_limit` `subscription` | Edit a license's note, device limit, or subscription. Provide at least one field. |
| `/license reset` | `key` | Reset HWID and IP address for a license, allowing the holder to re-authenticate from any device. |

---

### `/device`

Devices are identified by their type and ID value, not by username or license key.

| Subcommand | Options | Description |
|---|---|---|
| `/device list` | `subscription` | List all devices in the current app. Optionally filter by subscription name. |
| `/device view` | `device_type` `device_id` | View details for a specific device. |
| `/device delete` | `device_type` `device_id` | Remove a specific device. |
| `/device reset` | `device_type` `device_id` | Reset HWID and IP for a specific device. |
| `/device ban` | `device_type` `device_id` | Ban a device from authenticating. |
| `/device unban` | `device_type` `device_id` | Remove a ban from a device. |
| `/device pause` | `device_type` `device_id` | Temporarily disable a device. |
| `/device unpause` | `device_type` `device_id` | Re-enable a paused device. |
| `/device extend` | `device_type` `device_id` `days` | Add days to a device's expiry. |
| `/device shorten` | `device_type` `device_id` `days` | Remove days from a device's expiry. |

`device_type` accepts: **Motherboard ID** or **Processor ID**.

---

### `/variable`

| Subcommand | Options | Description |
|---|---|---|
| `/variable list` | - | List all variables for the selected app. Read-only variables are marked with a lock icon. |
| `/variable view` | `key` | View the value and write status of a variable. |
| `/variable set` | `key` `value` | Create or update a variable's value. |
| `/variable delete` | `key` | Delete a variable. |

---

### `/stats`

Show a quick summary of the selected app - total users, licenses, devices, subscriptions, variables, staff, resellers, plan, and app status.

---

### `/config`

> Requires **Administrator** permission.

| Subcommand | Options | Description |
|---|---|---|
| `/config ephemeral` | `true` / `false` | Toggle whether bot replies are private (only visible to the person who ran the command) or public. Takes effect immediately - no restart needed. |
| `/config status` | - | Show the current bot configuration for this server. |

---

### `/help`

Lists all available commands grouped by category.

---

## Data Storage

Bot configuration and per-user app selections are stored locally in `data/bot.json`. This file is created automatically on first run. Back it up if you want to preserve your settings across reinstalls.

---

## Notes

- **DM delivery** - generated license keys and new user credentials are sent to the DMs of whoever ran the command, not posted in the channel. Make sure you have DMs enabled from server members.
- **Autocomplete** - app names and subscription names are fetched live from your AuthlyX account as you type. If something was just created and is not showing yet, type the name manually - it still works.
- **App selection** - each user's selected app is stored individually. Use `/app select` to switch apps.
- **Re-deploying commands** - run `npm run deploy` any time you update the bot code to re-register slash command definitions with Discord.
- **Ephemeral replies** - the default is controlled by the `EPHEMERAL` variable in `.env`. Server admins can override this at any time with `/config ephemeral` without restarting the bot.

---

## License

This bot is part of the AuthlyX platform. Usage is subject to your AuthlyX plan and terms of service.
