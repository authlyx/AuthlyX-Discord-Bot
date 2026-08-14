const { SlashCommandBuilder } = require("discord.js");
const { info } = require("../utils/embeds");
const { resolveEphemeral } = require("../utils/db");

const COMMANDS = `
**Config**
\`/config ephemeral\` - Toggle ephemeral (private) replies
\`/app select\` - Choose the active app
\`/app current\` - Show currently selected app

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
\`/license edit\` - Edit note / device limit / subscription
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

**Stats**
\`/stats\` -Show app stats and usage chart
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
