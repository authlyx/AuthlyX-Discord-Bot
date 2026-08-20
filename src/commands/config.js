const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setEphemeral, resolveEphemeral, addAllowedUser, removeAllowedUser, listAllowedUsers } = require("../utils/db");
const { success, info, error } = require("../utils/embeds");
const { field } = require("../utils/embeds");

function accessMode() {
  const mode = (process.env.ACCESS_MODE || "admin").toLowerCase();
  return ["admin", "whitelist", "role"].includes(mode) ? mode : "admin";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Bot configuration for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName("ephemeral").setDescription("Toggle whether bot replies are private (only visible to you)")
      .addBooleanOption(o => o.setName("enabled").setDescription("true = private replies, false = public replies").setRequired(true)))
    .addSubcommand(s => s.setName("status").setDescription("Show current bot configuration"))
    .addSubcommand(s => s.setName("allow-user").setDescription("Grant a Discord user access to bot commands (whitelist access mode only)")
      .addUserOption(o => o.setName("user").setDescription("The user to grant access to").setRequired(true)))
    .addSubcommand(s => s.setName("disallow-user").setDescription("Revoke a Discord user's access to bot commands")
      .addUserOption(o => o.setName("user").setDescription("The user to revoke access from").setRequired(true)))
    .addSubcommand(s => s.setName("list-users").setDescription("List Discord users with whitelisted access")),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    const sub = interaction.options.getSubcommand();

    try {
      if (sub === "ephemeral") {
        const value = interaction.options.getBoolean("enabled");
        setEphemeral(guildId, value);
        await interaction.editReply({ embeds: [success(
          `Ephemeral replies ${value ? "enabled" : "disabled"}`,
          [],
          value
            ? "Replies will only be visible to the user who ran the command."
            : "Replies will be visible to everyone in the channel."
        )] });

      } else if (sub === "status") {
        const ephemeral = resolveEphemeral(guildId);
        const users = listAllowedUsers(guildId);
        await interaction.editReply({ embeds: [info("Bot Configuration", [
          field("Ephemeral Replies", ephemeral ? "Enabled (private)" : "Disabled (public)", true),
          field("Access Mode", accessMode(), true),
          field("Whitelisted Users", String(users.length), true),
        ])] });

      } else if (sub === "allow-user") {
        const user = interaction.options.getUser("user");
        addAllowedUser(guildId, user.id, user.tag);
        const note = accessMode() !== "whitelist"
          ? " Note: `ACCESS_MODE` is not set to `whitelist`, so this has no effect until it is."
          : "";
        await interaction.editReply({ embeds: [success(`Granted access to **${user.tag}**`, [], note || null)] });

      } else if (sub === "disallow-user") {
        const user = interaction.options.getUser("user");
        removeAllowedUser(guildId, user.id);
        await interaction.editReply({ embeds: [success(`Revoked access from **${user.tag}**`)] });

      } else if (sub === "list-users") {
        const users = listAllowedUsers(guildId);
        if (!users.length) {
          return interaction.editReply({ embeds: [info("Whitelisted Users", [], "No users have been granted access yet.")] });
        }
        const lines = users.map(u => `**${u.tag}** (\`${u.id}\`)`);
        await interaction.editReply({ embeds: [info("Whitelisted Users", [], lines.join("\n"))] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
