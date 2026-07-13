const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { setEphemeral, resolveEphemeral } = require("../utils/db");
const { success, info, error } = require("../utils/embeds");
const { field } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Bot configuration for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName("ephemeral").setDescription("Toggle whether bot replies are private (only visible to you)")
      .addBooleanOption(o => o.setName("enabled").setDescription("true = private replies, false = public replies").setRequired(true)))
    .addSubcommand(s => s.setName("status").setDescription("Show current bot configuration")),

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
        await interaction.editReply({ embeds: [info("Bot Configuration", [
          field("Ephemeral Replies", ephemeral ? "✅ Enabled (private)" : "❌ Disabled (public)", true),
        ])] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
