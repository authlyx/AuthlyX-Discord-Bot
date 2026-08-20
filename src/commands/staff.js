const { SlashCommandBuilder } = require("discord.js");
const { eliteRequest } = require("../utils/api");
const { prepareRoleContext } = require("../utils/context");
const { success, error, info, field } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Manage staff members")
    .addSubcommand(s => s.setName("add").setDescription("Add a new staff member with an existing role")
      .addStringOption(o => o.setName("role").setDescription("Staff role").setRequired(true).setAutocomplete(true))
      .addStringOption(o => o.setName("username").setDescription("Username (for a brand new staff account)"))
      .addStringOption(o => o.setName("email").setDescription("Email (for a brand new staff account)"))
      .addStringOption(o => o.setName("existing_id").setDescription("Existing staff public ID (to assign an existing staff account instead)")))
    .addSubcommand(s => s.setName("edit").setDescription("Change a staff member's role")
      .addStringOption(o => o.setName("identifier").setDescription("Staff username or public ID").setRequired(true))
      .addStringOption(o => o.setName("role").setDescription("New staff role").setRequired(true).setAutocomplete(true)))
    .addSubcommand(s => s.setName("ban").setDescription("Ban a staff member")
      .addStringOption(o => o.setName("identifier").setDescription("Staff username or public ID").setRequired(true)))
    .addSubcommand(s => s.setName("unban").setDescription("Unban a staff member")
      .addStringOption(o => o.setName("identifier").setDescription("Staff username or public ID").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List staff members")),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    try {
      const data = await eliteRequest("staff", "roles", "", {});
      const roles = Array.isArray(data.roles) ? data.roles : [];
      const choices = roles
        .filter(r => (r.name || "").toLowerCase().includes(focused))
        .slice(0, 25)
        .map(r => ({ name: r.name, value: String(r.id) }));
      await interaction.respond(choices);
    } catch (e) {
      console.error("[autocomplete:staff role]", e.message);
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
        const roleId = interaction.options.getString("role");
        const existingId = interaction.options.getString("existing_id");
        const username = interaction.options.getString("username");
        const email = interaction.options.getString("email");

        if (existingId) {
          const data = await eliteRequest("staff", "add", "", { type: "existing", staff_public_id: existingId, role_id: roleId });
          return interaction.editReply({ embeds: [success(`Staff **${data.staff.username}** assigned`, [
            field("Public ID", data.staff.public_id, true),
          ])] });
        }

        if (!username || !email) {
          return interaction.editReply({ embeds: [error("Provide `username` and `email` for a new staff account, or `existing_id` to assign an existing one.")] });
        }

        const data = await eliteRequest("staff", "add", "", { type: "new", username, email, role_id: roleId });

        try {
          await interaction.user.send({
            embeds: [info("New Staff Account Created", [
              field("Username", data.staff.username, true),
              field("Default Password", "1", true),
              field("Public ID", data.staff.public_id, true),
            ], "They'll be asked to change this password on first login.")],
          });
        } catch {}

        await interaction.editReply({ embeds: [success(`Staff **${data.staff.username}** added`, [
          field("Public ID", data.staff.public_id, true),
        ], "Login details sent to your DMs.")] });

      } else if (sub === "edit") {
        const identifier = interaction.options.getString("identifier");
        const roleId = interaction.options.getString("role");
        await eliteRequest("staff", "edit", "", { identifier, role_id: roleId });
        await interaction.editReply({ embeds: [success(`Staff **${identifier}** role updated`)] });

      } else if (sub === "ban") {
        const identifier = interaction.options.getString("identifier");
        await eliteRequest("staff", "ban", "", { identifier });
        await interaction.editReply({ embeds: [success(`Staff **${identifier}** banned`)] });

      } else if (sub === "unban") {
        const identifier = interaction.options.getString("identifier");
        await eliteRequest("staff", "unban", "", { identifier });
        await interaction.editReply({ embeds: [success(`Staff **${identifier}** unbanned`)] });

      } else if (sub === "list") {
        const data = await eliteRequest("staff", "list", "", {});
        const staff = Array.isArray(data.staff) ? data.staff : [];
        if (!staff.length) {
          return interaction.editReply({ embeds: [info("Staff", [], "No staff members yet.")] });
        }
        const lines = staff.slice(0, 25).map(s =>
          `**${s.username}** - ${s.role_name || "No role"} - ${s.is_active ? "Active" : "Banned"}`
        );
        await interaction.editReply({ embeds: [info("Staff Members", [], lines.join("\n"))] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
