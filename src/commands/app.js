const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { setAppSelection, resolveApp, resolveEphemeral } = require("../utils/db");
const { eliteRequest } = require("../utils/api");
const { success, info, error } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("app")
    .setDescription("Manage selected app")
    .addSubcommand(s => s.setName("select").setDescription("Select an app to work with"))
    .addSubcommand(s => s.setName("current").setDescription("Show currently selected app"))
    .addSubcommand(s => s.setName("enable").setDescription("Enable the selected app"))
    .addSubcommand(s => s.setName("disable").setDescription("Disable the selected app"))
    .addSubcommand(s => s.setName("user-panel").setDescription("Toggle the selected app's user panel")
      .addBooleanOption(o => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),

  async execute(interaction) {
    const ephemeral = resolveEphemeral(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    if (sub === "current") {
      await interaction.deferReply({ ephemeral });
      const app = resolveApp(interaction.guildId, interaction.user.id);
      await interaction.editReply({
        embeds: [info("Current App", [], app ? `**${app}**` : "No app selected. Use `/app select`.")],
      });
      return;
    }

    if (sub === "select") {
      await interaction.deferReply({ ephemeral: true });

      let apps = [];
      try {
        const data = await eliteRequest("app", "list", "", {});
        apps = Array.isArray(data.apps) ? data.apps : Array.isArray(data) ? data : [];
      } catch (e) {
        await interaction.editReply({ embeds: [error(`Failed to fetch apps: ${e.message}`)] });
        return;
      }

      if (!apps.length) {
        await interaction.editReply({ embeds: [info("No Apps Found", [], "No enabled apps found on your AuthlyX account.")] });
        return;
      }

      const limited = apps.slice(0, 25);
      const rows = [];
      for (let i = 0; i < limited.length; i += 5) {
        const row = new ActionRowBuilder().addComponents(
          limited.slice(i, i + 5).map(name =>
            new ButtonBuilder()
              .setCustomId(`app_select:${name}`)
              .setLabel(name)
              .setStyle(ButtonStyle.Primary)
          )
        );
        rows.push(row);
      }

      await interaction.editReply({
        embeds: [info("Select an App", [], "Click a button to set your active app.")],
        components: rows,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const appName = resolveApp(interaction.guildId, interaction.user.id);
    if (!appName) {
      await interaction.editReply({ embeds: [error("No app selected. Use `/app select` first.")] });
      return;
    }

    try {
      if (sub === "enable" || sub === "disable") {
        await eliteRequest("app", "edit", appName, { is_enabled: sub === "enable" });
        await interaction.editReply({ embeds: [success(`App **${appName}** ${sub}d`)] });

      } else if (sub === "user-panel") {
        const enabled = interaction.options.getBoolean("enabled");
        await eliteRequest("app", "edit", appName, { user_panel_enabled: enabled });
        await interaction.editReply({ embeds: [success(`User panel ${enabled ? "enabled" : "disabled"} for **${appName}**`)] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
