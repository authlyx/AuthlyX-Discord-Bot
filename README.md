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
ACCESS_MODE=admin
ALLOWED_ROLE=Admin
EPHEMERAL=true
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot's token from the Discord developer portal |
| `DISCORD_CLIENT_ID` | Your bot's application/client ID |
| `AUTHLYX_ELITE_KEY` | Elite Key from your AuthlyX dashboard |
| `AUTHLYX_API_BASE` | AuthlyX API base URL - do not change this unless you are self hosting the bot |
| `ACCESS_MODE` | Who can use bot commands. `admin` (default), `whitelist`, or `role` - see Access Control below. |
| `ALLOWED_ROLE` | Only used when `ACCESS_MODE=role`. Role name or ID that can use bot commands (e.g. `Admin`, `Staff`, or a role ID). |
| `EPHEMERAL` | `true` = replies only visible to the user who ran the command. `false` = replies visible to the whole channel. Can also be changed per-server with `/config ephemeral`. |

---

## Access Control

`ACCESS_MODE` controls who is allowed to run bot commands. Being a Discord **Administrator** does not automatically grant access in `whitelist` mode - useful if you want to give someone the Administrator role without giving them access to your licensing data.

| Mode | Who can use the bot |
|---|---|
| `admin` (default) | Only Discord Administrators. |
| `whitelist` | Only Discord users explicitly granted access with `/config allow-user`. Administrators are **not** automatically included - add yourself too. |
| `role` | Discord Administrators, plus anyone holding the role set in `ALLOWED_ROLE`. |

Managing the whitelist (`whitelist` mode):

| Command | Description |
|---|---|
| `/config allow-user` | Grant a Discord user access to bot commands. |
| `/config disallow-user` | Revoke a Discord user's access. |
| `/config list-users` | List all whitelisted users for this server. |

`/config` itself always requires Discord Administrator permission, regardless of `ACCESS_MODE` - so only server admins can manage who else gets access.

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
| `/app current` | Show which app is currently selected. |

Each Discord user's app selection is saved separately, so multiple people can work with different apps in the same server.

---

### `/user`

| Subcommand | Options | Description |
|---|---|---|
| `/user add` | `username` `password` `subscription` `days` `email` `device_limit` | Create a new user. Subscription options are autocompleted. Credentials are sent to your DMs. `days` = 0 creates set a lifetime expiry date. |
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
| `/license add` | `key` `subscription` `days` `device_limit` `note` | Add a license with a specific key you provide. `days` = 0 creates a lifetime license. |
| `/license generate` | `subscription` `days` `amount` `device_limit` `random_chars` `note` | Generate one or more random license keys (1-50 at a time). `days` = 0 for lifetime licenses. Keys are delivered as a `licenses.txt` file attachment in your DMs, not raw text - also safe even at the max batch size. |
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
| `/device list` | `subscription` | List all devices in the current app. Optionally filter by subscription name (autocompleted). |
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

### `/staff`

Manages staff members assigned to your account. Only assigns roles that already exist in your AuthlyX dashboard - the bot does not create or edit roles themselves.

| Subcommand | Options | Description |
|---|---|---|
| `/staff add` | `role` `username` `email` or `existing_id` | Add a staff member with an existing role. Provide `username`/`email` to create a new staff account, or `existing_id` to assign an existing one. Login details are sent to your DMs. |
| `/staff edit` | `identifier` `role` | Change a staff member's role. `identifier` is their username or public ID. |
| `/staff ban` | `identifier` | Ban a staff member from logging in. |
| `/staff unban` | `identifier` | Remove a ban from a staff member. |
| `/staff list` | - | List all staff members assigned to your account. |

---

### `/reseller`

Manages resellers assigned to your account. Only assigns rate plans that already exist in your AuthlyX dashboard - the bot does not create or edit rate plans themselves.

| Subcommand | Options | Description |
|---|---|---|
| `/reseller add` | `username` `email` or `existing_id` `rate_plan` | Add a reseller. Provide `username`/`email` to create a new account, or `existing_id` to assign an existing one. Login details are sent to your DMs. |
| `/reseller edit` | `identifier` `rate_plan` | Change a reseller's rate plan. Leave `rate_plan` blank to clear it. |
| `/reseller ban` | `identifier` | Ban a reseller from logging in. |
| `/reseller unban` | `identifier` | Remove a ban from a reseller. |
| `/reseller add-coins` | `identifier` `amount` | Add coins to a reseller's balance. |
| `/reseller remove-coins` | `identifier` `amount` | Remove coins from a reseller's balance. Fails if it would go negative. |
| `/reseller list` | - | List all resellers assigned to your account. |

---

### `/ping`

Show the bot's Discord gateway latency and AuthlyX API response time.

---

### `/config`

> Requires **Administrator** permission.

| Subcommand | Options | Description |
|---|---|---|
| `/config ephemeral` | `true` / `false` | Toggle whether bot replies are private (only visible to the person who ran the command) or public. |
| `/config status` | - | Show the current bot configuration for this server. |
| `/config allow-user` | `user` | Grant a Discord user access to bot commands. Only takes effect in `whitelist` access mode. |
| `/config disallow-user` | `user` | Revoke a Discord user's access to bot commands. |
| `/config list-users` | - | List all users granted access via `/config allow-user`. |

---

### `/help`

Lists all available commands grouped by category.

---

## Data Storage

Bot configuration and per-user app selections are stored locally in `data/bot.json`. This file is created automatically on first run. Back it up if you want to preserve your settings across reinstalls.

---

## Notes

- **DM delivery** - generated license keys and new user credentials are sent to the DMs of whoever ran the command, not posted in the channel. Make sure you have DMs enabled from server members. If a DM fails to send (e.g. DMs disabled), the bot's reply in-channel will say so instead of silently claiming success.
- **Autocomplete** - app names and subscription names are fetched live from your AuthlyX account as you type. If something was just created and is not showing yet, type the name manually - it still works.
- **App selection** - each user's selected app is stored individually. Use `/app select` to switch apps.
- **Re-deploying commands** - run `npm run deploy` any time you update the bot code to re-register slash command definitions with Discord.
- **Ephemeral replies** - the default is controlled by the `EPHEMERAL` variable in `.env`. Server admins can override this at any time with `/config ephemeral` without restarting the bot.
- **Lifetime expiries** - anywhere you're asked for `days` on a create action (`/user add`, `/license add`, `/license generate`), entering `0` creates a license/user that never expires. Negative values are rejected.
- **Security** - your Elite Key is sent in a request header, not the URL, so it never ends up in proxy or CDN access logs. Treat `AUTHLYX_ELITE_KEY` like a password - anyone with it has full access to your AuthlyX account.

---


## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Slash commands don't show up in Discord | Run `npm run deploy` again - commands are only registered with Discord when you do this, not automatically on `npm start`. Can take up to an hour to propagate globally the first time. |
| "No app selected. Use `/app select` first." | Every command except `/app select`/`/app current` needs an app selected first, per Discord user, per server. |
| "You need Administrator permission to use this command." | `ACCESS_MODE=admin` (the default) and the user isn't a Discord Administrator. |
| "You don't have permission to use this command." | `ACCESS_MODE=whitelist` and the user hasn't been added with `/config allow-user`. |
| "You need the **X** role to use this command." | `ACCESS_MODE=role` and the user doesn't hold the role set in `ALLOWED_ROLE` and isn't an Administrator. |
| Bot never responds / commands time out | Check `DISCORD_TOKEN` is correct and the bot process is actually running (`npm start`). Check the console for errors. |
| "Invalid elite key" | `AUTHLYX_ELITE_KEY` is wrong, expired, or was reset from the dashboard - generate a fresh one and update `.env`. |
| Generated keys / new user credentials never arrive | The recipient has server DMs disabled. The bot's reply will say so - ask them to enable DMs from server members, or re-run the command after they do. |

---

## License

This bot is part of the AuthlyX platform. Usage is subject to your AuthlyX plan and terms of service.
