const { SlashCommandBuilder } = require("discord.js");
const { eliteRequest } = require("../utils/api");
const { prepareRoleContext } = require("../utils/context");
const { success, error, info, field } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reseller")
    .setDescription("Manage resellers")
    .addSubcommand(s => s.setName("add").setDescription("Add a reseller")
      .addStringOption(o => o.setName("username").setDescription("Username (for a brand new reseller account)"))
      .addStringOption(o => o.setName("email").setDescription("Email (for a brand new reseller account)"))
      .addStringOption(o => o.setName("existing_id").setDescription("Existing reseller public ID (to assign an existing reseller instead)"))
      .addStringOption(o => o.setName("rate_plan").setDescription("Rate plan to assign").setAutocomplete(true)))
    .addSubcommand(s => s.setName("edit").setDescription("Change a reseller's rate plan")
      .addStringOption(o => o.setName("identifier").setDescription("Reseller username or public ID").setRequired(true))
      .addStringOption(o => o.setName("rate_plan").setDescription("New rate plan (leave blank to clear)").setAutocomplete(true)))
    .addSubcommand(s => s.setName("ban").setDescription("Ban a reseller")
      .addStringOption(o => o.setName("identifier").setDescription("Reseller username or public ID").setRequired(true)))
    .addSubcommand(s => s.setName("unban").setDescription("Unban a reseller")
      .addStringOption(o => o.setName("identifier").setDescription("Reseller username or public ID").setRequired(true)))
    .addSubcommand(s => s.setName("add-coins").setDescription("Add coins to a reseller's balance")
      .addStringOption(o => o.setName("identifier").setDescription("Reseller username or public ID").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setDescription("Amount to add").setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName("remove-coins").setDescription("Remove coins from a reseller's balance")
      .addStringOption(o => o.setName("identifier").setDescription("Reseller username or public ID").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setDescription("Amount to remove").setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName("list").setDescription("List resellers")),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    try {
      const data = await eliteRequest("reseller", "rate_plans", "", {});
      const plans = Array.isArray(data.rate_plans) ? data.rate_plans : [];
      const choices = plans
        .filter(p => (p.name || "").toLowerCase().includes(focused))
        .slice(0, 25)
        .map(p => ({ name: p.name, value: String(p.id) }));
      await interaction.respond(choices);
    } catch (e) {
      console.error("[autocomplete:reseller rate_plan]", e.message);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await prepareRoleContext(interaction);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();

    try {
      if (sub === "add") {
        const existingId = interaction.options.getString("existing_id");
        const username = interaction.options.getString("username");
        const email = interaction.options.getString("email");
        const ratePlan = interaction.options.getString("rate_plan");

        if (existingId) {
          const data = await eliteRequest("reseller", "add", "", { type: "existing", reseller_public_id: existingId, rate_profile_id: ratePlan });
          return interaction.editReply({ embeds: [success(`Reseller **${data.reseller.username}** assigned`, [
            field("Public ID", data.reseller.public_id, true),
          ])] });
        }

        if (!username || !email) {
          return interaction.editReply({ embeds: [error("Provide `username` and `email` for a new reseller account, or `existing_id` to assign an existing one.")] });
        }

        const data = await eliteRequest("reseller", "add", "", { type: "new", username, email, rate_profile_id: ratePlan });

        try {
          await interaction.user.send({
            embeds: [info("New Reseller Account Created", [
              field("Username", data.reseller.username, true),
              field("Default Password", "1", true),
              field("Public ID", data.reseller.public_id, true),
            ], "They'll be asked to change this password on first login.")],
          });
        } catch {}

        await interaction.editReply({ embeds: [success(`Reseller **${data.reseller.username}** added`, [
          field("Public ID", data.reseller.public_id, true),
        ], "Login details sent to your DMs.")] });

      } else if (sub === "edit") {
        const identifier = interaction.options.getString("identifier");
        const ratePlan = interaction.options.getString("rate_plan");
        await eliteRequest("reseller", "edit", "", { identifier, rate_profile_id: ratePlan });
        await interaction.editReply({ embeds: [success(`Reseller **${identifier}** updated`)] });

      } else if (sub === "ban") {
        const identifier = interaction.options.getString("identifier");
        await eliteRequest("reseller", "ban", "", { identifier });
        await interaction.editReply({ embeds: [success(`Reseller **${identifier}** banned`)] });

      } else if (sub === "unban") {
        const identifier = interaction.options.getString("identifier");
        await eliteRequest("reseller", "unban", "", { identifier });
        await interaction.editReply({ embeds: [success(`Reseller **${identifier}** unbanned`)] });

      } else if (sub === "add-coins" || sub === "remove-coins") {
        const identifier = interaction.options.getString("identifier");
        const amount = interaction.options.getInteger("amount");
        const signedAmount = sub === "add-coins" ? amount : -amount;
        const data = await eliteRequest("reseller", "coins", "", {
          identifier, amount: signedAmount,
          description: `${sub === "add-coins" ? "Added" : "Removed"} via Discord bot`,
        });
        await interaction.editReply({ embeds: [success(`Reseller **${identifier}** balance updated`, [
          field("New Balance", String(data.points_balance), true),
        ])] });

      } else if (sub === "list") {
        const data = await eliteRequest("reseller", "list", "", {});
        const resellers = Array.isArray(data.resellers) ? data.resellers : [];
        if (!resellers.length) {
          return interaction.editReply({ embeds: [info("Resellers", [], "No resellers yet.")] });
        }
        const lines = resellers.slice(0, 25).map(r =>
          `**${r.username}** - ${r.points_balance || 0} coins - ${r.rate_profile_name || "No rate plan"} - ${r.is_active ? "Active" : "Banned"}`
        );
        await interaction.editReply({ embeds: [info("Resellers", [], lines.join("\n"))] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
