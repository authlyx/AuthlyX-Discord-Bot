const { SlashCommandBuilder } = require("discord.js");
const { prepareContext } = require("../utils/context");
const { eliteRequest } = require("../utils/api");
const { success, error, info, field } = require("../utils/embeds");
const { parseExpiryDays, formatExpiry } = require("../utils/parseExpiry");
const { resolveEphemeral, resolveApp } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Manage users")
    .addSubcommand(s => s.setName("add").setDescription("Create a new user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))
      .addStringOption(o => o.setName("password").setDescription("Password").setRequired(true))
      .addStringOption(o => o.setName("subscription").setDescription("Subscription name").setRequired(true).setAutocomplete(true))
      .addIntegerOption(o => o.setName("days").setDescription("Expiry in days").setRequired(true))
      .addStringOption(o => o.setName("email").setDescription("Email (optional)"))
      .addIntegerOption(o => o.setName("device_limit").setDescription("Max devices (default 1)")))
    .addSubcommand(s => s.setName("view").setDescription("View a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("Delete a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("ban").setDescription("Ban a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("unban").setDescription("Unban a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("pause").setDescription("Pause a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("unpause").setDescription("Unpause a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true)))
    .addSubcommand(s => s.setName("extend").setDescription("Extend user expiry")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))
      .addIntegerOption(o => o.setName("days").setDescription("Days to add").setRequired(true)))
    .addSubcommand(s => s.setName("shorten").setDescription("Shorten user expiry")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))
      .addIntegerOption(o => o.setName("days").setDescription("Days to remove").setRequired(true)))
    .addSubcommand(s => s.setName("change-password").setDescription("Change a user's password")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))
      .addStringOption(o => o.setName("new_password").setDescription("New password").setRequired(true)))
    .addSubcommand(s => s.setName("verify-password").setDescription("Verify a user's credentials")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))
      .addStringOption(o => o.setName("password").setDescription("Password").setRequired(true)))
    .addSubcommand(s => s.setName("reset").setDescription("Reset HWID and IP address for a user")
      .addStringOption(o => o.setName("username").setDescription("Username").setRequired(true))),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    try {
      const app = resolveApp(interaction.guildId, interaction.user.id);
      if (!app) return interaction.respond([]);
      const data = await eliteRequest("subscription", "list", app, {});
      const subs = Array.isArray(data.subscriptions) ? data.subscriptions : Array.isArray(data) ? data : [];
      const choices = subs
        .filter(s => {
          const name = typeof s === "string" ? s : s.name || "";
          return name.toLowerCase().includes(focused);
        })
        .slice(0, 25)
        .map(s => {
          const name = typeof s === "string" ? s : s.name || "";
          return { name, value: name };
        });
      await interaction.respond(choices);
    } catch (e) {
      console.error("[autocomplete:user subscription]", e.message);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const ephemeral = resolveEphemeral(interaction.guildId);
    await interaction.deferReply({ ephemeral });
    const ctx = await prepareContext(interaction);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();
    const username = interaction.options.getString("username");

    try {
      if (sub === "add") {
        const password = interaction.options.getString("password");
        const subscription = interaction.options.getString("subscription");
        const days = interaction.options.getInteger("days");
        const email = interaction.options.getString("email");
        const deviceLimit = interaction.options.getInteger("device_limit") || 1;
        const expiryDate = parseExpiryDays(days);

        await eliteRequest("user", "generate", ctx.appName, {
          username, password, email, subscription, expiry_date: expiryDate, device_limit: deviceLimit,
        });

        try {
          await interaction.user.send({
            embeds: [info("New User Created", [
              field("App", ctx.appName, true),
              field("Username", username, true),
              field("Password", password, true),
              field("Subscription", subscription, true),
              field("Expires", formatExpiry(expiryDate), true),
            ])],
          });
        } catch {}

        await interaction.editReply({ embeds: [success("User created", [
          field("Username", username, true),
          field("Subscription", subscription, true),
          field("Expires", formatExpiry(expiryDate), true),
        ], "Credentials sent to your DMs.")] });

      } else if (sub === "view") {
        const data = await eliteRequest("user", "info", ctx.appName, { username });
        const u = data.user;
        const daysLeft = u.expiry_date
          ? Math.max(0, Math.ceil((new Date(u.expiry_date) - Date.now()) / 86400000))
          : null;
        await interaction.editReply({ embeds: [info(`User: ${u.username}`, [
          field("Subscription", u.subscription_name || "-", true),
          field("Status", u.banned ? "🔴 Banned" : u.paused ? "🟡 Paused" : "🟢 Active", true),
          field("Email", u.email || "-", true),
          field("IP Address", u.ip_address || "-", true),
          field("Days Left", daysLeft !== null ? `${daysLeft} day(s)` : "-", true),
          field("Device Limit", String(u.device_limit || 1), true),
          field("Expiry Date", formatExpiry(u.expiry_date), true),
          field("Date Created", u.date_created ? new Date(u.date_created).toLocaleDateString("en-GB") : "-", true),
          field("Last Login", u.last_login ? new Date(u.last_login).toLocaleString("en-GB") : "-", true),
          field("Application", ctx.appName, true),
          field("Linked License", u.linked_license_key || "-"),
        ])] });

      } else if (sub === "delete") {
        await eliteRequest("user", "delete", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`User **${username}** deleted`)] });

      } else if (sub === "ban") {
        await eliteRequest("user", "ban", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`User **${username}** banned`)] });

      } else if (sub === "unban") {
        await eliteRequest("user", "unban", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`User **${username}** unbanned`)] });

      } else if (sub === "pause") {
        await eliteRequest("user", "pause", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`User **${username}** paused`)] });

      } else if (sub === "unpause") {
        await eliteRequest("user", "unpause", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`User **${username}** unpaused`)] });

      } else if (sub === "extend") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("user", "extend", ctx.appName, { username, days });
        await interaction.editReply({ embeds: [success(`Extended **${username}** by ${days} days`)] });

      } else if (sub === "shorten") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("user", "shorten", ctx.appName, { username, days });
        await interaction.editReply({ embeds: [success(`Shortened **${username}** by ${days} days`)] });

      } else if (sub === "change-password") {
        const newPass = interaction.options.getString("new_password");
        await eliteRequest("user", "reset_password", ctx.appName, { username, new_password: newPass });
        await interaction.editReply({ embeds: [success(`Password changed for **${username}**`)] });

      } else if (sub === "reset") {
        await eliteRequest("user", "reset_hwid", ctx.appName, { username });
        await interaction.editReply({ embeds: [success(`HWID and IP reset for **${username}**`)] });

      } else if (sub === "verify-password") {
        const password = interaction.options.getString("password");
        const data = await eliteRequest("user", "verify_password", ctx.appName, { username, password });
        await interaction.editReply({ embeds: [success("Credentials valid", [
          field("Username", data.username, true),
          field("Subscription", data.subscription || "-", true),
          field("Expiry", formatExpiry(data.expiry), true),
          field("Banned", data.banned ? "Yes" : "No", true),
          field("Paused", data.paused ? "Yes" : "No", true),
        ])] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
