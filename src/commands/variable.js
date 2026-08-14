const { SlashCommandBuilder } = require("discord.js");
const { prepareContext } = require("../utils/context");
const { eliteRequest } = require("../utils/api");
const { success, error, info, field } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("variable")
    .setDescription("Manage app variables")
    .addSubcommand(s => s.setName("list").setDescription("List all variables for the selected app"))
    .addSubcommand(s => s.setName("view").setDescription("View a variable value")
      .addStringOption(o => o.setName("key").setDescription("Variable key").setRequired(true)))
    .addSubcommand(s => s.setName("set").setDescription("Set or update a variable value")
      .addStringOption(o => o.setName("key").setDescription("Variable key").setRequired(true))
      .addStringOption(o => o.setName("value").setDescription("New value").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("Delete a variable")
      .addStringOption(o => o.setName("key").setDescription("Variable key").setRequired(true))),

  async execute(interaction) {
    const ctx = await prepareContext(interaction);
    if (!ctx) return;
    await interaction.deferReply({ ephemeral: ctx.ephemeral });

    const sub = interaction.options.getSubcommand();
    const varKey = interaction.options.getString("key");

    try {
      if (sub === "list") {
        const data = await eliteRequest("variable", "list", ctx.appName, {});
        const vars = Array.isArray(data.variables) ? data.variables : [];
        if (!vars.length) {
          return interaction.editReply({ embeds: [info("No variables found")] });
        }
        const lines = vars.map(v =>
          `**${v.key}** = \`${v.value ?? "-"}\` ${v.writable === false ? "🔒" : ""}`
        ).join("\n").slice(0, 4000);
        await interaction.editReply({ embeds: [info(`Variables (${vars.length})`, [], lines)] });

      } else if (sub === "view") {
        const data = await eliteRequest("variable", "get", ctx.appName, { key: varKey });
        const v = data.variable || data;
        await interaction.editReply({ embeds: [info(`Variable: ${varKey}`, [
          field("Value", v.value ?? "-"),
          field("Writable", v.writable === false ? "No 🔒" : "Yes", true),
        ])] });

      } else if (sub === "set") {
        const value = interaction.options.getString("value");
        await eliteRequest("variable", "set", ctx.appName, { key: varKey, value });
        await interaction.editReply({ embeds: [success(`Variable **${varKey}** updated`)] });

      } else if (sub === "delete") {
        await eliteRequest("variable", "delete", ctx.appName, { key: varKey });
        await interaction.editReply({ embeds: [success(`Variable **${varKey}** deleted`)] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
