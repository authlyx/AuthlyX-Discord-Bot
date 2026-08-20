const { resolveApp, resolveEphemeral, isUserAllowed } = require("./db");
require("dotenv").config();

function accessMode() {
  const mode = (process.env.ACCESS_MODE || "admin").toLowerCase();
  return ["admin", "whitelist", "role"].includes(mode) ? mode : "admin";
}

function checkAccess(interaction) {
  const mode = accessMode();
  const member = interaction.member;

  if (mode === "admin") {
    return member.permissions.has("Administrator");
  }

  if (mode === "whitelist") {
    return isUserAllowed(interaction.guildId, interaction.user.id);
  }

  const allowedRole = process.env.ALLOWED_ROLE;
  if (!allowedRole) return member.permissions.has("Administrator");
  return member.permissions.has("Administrator") ||
    member.roles.cache.some(r => r.name === allowedRole || r.id === allowedRole);
}

function accessDeniedMessage() {
  const mode = accessMode();
  if (mode === "whitelist") {
    return "You don't have permission to use this command. Ask a server admin to grant you access with `/config allow-user`.";
  }
  if (mode === "role") {
    const allowedRole = process.env.ALLOWED_ROLE;
    return allowedRole
      ? `You need the **${allowedRole}** role to use this command.`
      : "You need Administrator permission to use this command.";
  }
  return "You need Administrator permission to use this command.";
}

async function prepareContext(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const deferred = interaction.deferred || interaction.replied;

  const reply = (content) => deferred
    ? interaction.editReply({ content, embeds: [], components: [] })
    : interaction.reply({ content, ephemeral: true });

  if (!checkAccess(interaction)) {
    await reply(accessDeniedMessage());
    return null;
  }

  const appName = resolveApp(guildId, userId);
  if (!appName) {
    await reply("No app selected. Use `/app select` first.");
    return null;
  }

  const ephemeral = resolveEphemeral(guildId);
  return { guildId, userId, appName, ephemeral };
}

async function prepareRoleContext(interaction) {
  const deferred = interaction.deferred || interaction.replied;

  const reply = (content) => deferred
    ? interaction.editReply({ content, embeds: [], components: [] })
    : interaction.reply({ content, ephemeral: true });

  if (!checkAccess(interaction)) {
    await reply(accessDeniedMessage());
    return null;
  }

  return { guildId: interaction.guildId, userId: interaction.user.id, ephemeral: resolveEphemeral(interaction.guildId) };
}

module.exports = { prepareContext, prepareRoleContext };
