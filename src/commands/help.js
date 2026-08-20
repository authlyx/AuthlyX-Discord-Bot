const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../utils/embeds");
const { resolveEphemeral } = require("../utils/db");

const COMMANDS = `
**Config**
\`/config ephemeral\` - Toggle ephemeral (private) replies
\`/config allow-user\` - Grant a user access (whitelist access mode only)
\`/config disallow-user\` - Revoke a user's access
\`/config list-users\` - List whitelisted users
\`/config status\` - Show current bot configuration
\`/app select\` - Choose the active app
\`/app current\` - Show currently selected app

**App Management**
\`/app enable\` / \`disable\` - Enable or disable the selected app
\`/app user-panel\` - Toggle the selected app's user panel

**Users**
\`/user add\` - Create a new user
\`/user view\` - View user info
\`/user delete\` - Delete a user
\`/user ban\` / \`unban\` - Ban or unban a user
\`/user pause\` / \`unpause\` - Pause or unpause a user
\`/user extend\` / \`shorten\` - Adjust expiry
\`/user change-password\` - Set a new password for a user
\`/user reset\` - Reset HWID and IP address
\`/user verify-password\` - Verify credentials

**Licenses**
\`/license add\` - Add a license with a custom key
\`/license generate\` - Generate random licenses (supports bulk)
\`/license view\` - View license details
\`/license edit\` - Edit note, device limit, or subscription
\`/license delete\` - Delete a license
\`/license ban\` / \`unban\` - Ban or unban
\`/license pause\` / \`unpause\` - Pause or unpause
\`/license extend\` / \`shorten\` - Adjust expiry
\`/license reset\` - Reset HWID and IP address

**Devices**
\`/device list\` - List devices in the app (filter by subscription)
\`/device view\` - View a device by type and ID
\`/device delete\` - Remove a device
\`/device reset\` - Reset HWID and IP for a device
\`/device ban\` / \`unban\` - Ban or unban a device
\`/device pause\` / \`unpause\` - Pause or unpause a device
\`/device extend\` / \`shorten\` - Adjust device expiry

**Variables**
\`/variable list\` - List all variables
\`/variable view\` - View a variable value
\`/variable set\` - Set or update a variable
\`/variable delete\` - Delete a variable

**Staff**
\`/staff add\` - Add a staff member (new account or existing, with a role)
\`/staff edit\` - Change a staff member's role
\`/staff ban\` / \`unban\` - Ban or unban a staff member
\`/staff list\` - List staff members

**Resellers**
\`/reseller add\` - Add a reseller (new account or existing, with a rate plan)
\`/reseller edit\` - Change a reseller's rate plan
\`/reseller ban\` / \`unban\` - Ban or unban a reseller
\`/reseller add-coins\` / \`remove-coins\` - Adjust a reseller's coin balance
\`/reseller list\` - List resellers

**Other**
\`/stats\` - Show app stats and usage chart
\`/ping\` - Check the bot's connection and API response time
`.trim();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available AuthlyX bot commands"),

  async execute(interaction) {
    const ephemeral = resolveEphemeral(interaction.guildId);
    await interaction.reply({
      embeds: [info("AuthlyX Bot Commands", [], COMMANDS)],
      ephemeral,
    });
  },
};
