const { resolveApp, resolveEphemeral } = require("./db");
require("dotenv").config();

async function prepareContext(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const deferred = interaction.deferred || interaction.replied;

  const reply = (content) => deferred
    ? interaction.editReply({ content, embeds: [], components: [] })
    : interaction.reply({ content, ephemeral: true });

  const allowedRole = process.env.ALLOWED_ROLE;
  if (allowedRole) {
    const member = interaction.member;
    const hasRole = member.roles.cache.some(
      r => r.name === allowedRole || r.id === allowedRole
    );
    if (!hasRole && !member.permissions.has("Administrator")) {
      await reply(`❌ You need the **${allowedRole}** role to use this command.`);
      return null;
    }
  }

  const appName = resolveApp(guildId, userId);
  if (!appName) {
    await reply("❌ No app selected. Use `/app select` first.");
    return null;
  }

  const ephemeral = resolveEphemeral(guildId);
  return { guildId, userId, appName, ephemeral };
}

module.exports = { prepareContext };
