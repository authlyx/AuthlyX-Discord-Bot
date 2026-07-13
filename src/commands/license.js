const { SlashCommandBuilder } = require("discord.js");
const { prepareContext } = require("../utils/context");
const { eliteRequest } = require("../utils/api");
const { success, error, info, field } = require("../utils/embeds");
const { parseExpiryDays, formatExpiry } = require("../utils/parseExpiry");
const { resolveEphemeral, resolveApp } = require("../utils/db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("license")
    .setDescription("Manage licenses")
    .addSubcommand(s => s.setName("add").setDescription("Add a license with a custom key")
      .addStringOption(o => o.setName("key").setDescription("License key to add").setRequired(true))
      .addStringOption(o => o.setName("subscription").setDescription("Subscription name").setRequired(true).setAutocomplete(true))
      .addIntegerOption(o => o.setName("days").setDescription("Expiry in days").setRequired(true))
      .addIntegerOption(o => o.setName("device_limit").setDescription("Max devices (default 1)"))
      .addStringOption(o => o.setName("note").setDescription("Optional note")))
    .addSubcommand(s => s.setName("generate").setDescription("Generate one or more random licenses")
      .addStringOption(o => o.setName("subscription").setDescription("Subscription name").setRequired(true).setAutocomplete(true))
      .addIntegerOption(o => o.setName("days").setDescription("Expiry in days").setRequired(true))
      .addIntegerOption(o => o.setName("amount").setDescription("How many to generate (default 1, max 50)"))
      .addIntegerOption(o => o.setName("device_limit").setDescription("Max devices per license (default 1)"))
      .addBooleanOption(o => o.setName("random_chars").setDescription("Add random chars to keys (default true)"))
      .addStringOption(o => o.setName("note").setDescription("Optional note attached to each license")))
    .addSubcommand(s => s.setName("view").setDescription("View a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("Delete a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("ban").setDescription("Ban a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("unban").setDescription("Unban a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("pause").setDescription("Pause a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("unpause").setDescription("Unpause a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true)))
    .addSubcommand(s => s.setName("extend").setDescription("Extend a license expiry")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true))
      .addIntegerOption(o => o.setName("days").setDescription("Days to add").setRequired(true)))
    .addSubcommand(s => s.setName("shorten").setDescription("Shorten a license expiry")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true))
      .addIntegerOption(o => o.setName("days").setDescription("Days to remove").setRequired(true)))
    .addSubcommand(s => s.setName("edit").setDescription("Edit a license field")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true))
      .addStringOption(o => o.setName("note").setDescription("New note"))
      .addIntegerOption(o => o.setName("device_limit").setDescription("New device limit"))
      .addStringOption(o => o.setName("subscription").setDescription("New subscription name")))
    .addSubcommand(s => s.setName("reset").setDescription("Reset HWID and IP address for a license")
      .addStringOption(o => o.setName("key").setDescription("License key").setRequired(true))),

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
      console.error("[autocomplete:license subscription]", e.message);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    const ephemeral = resolveEphemeral(interaction.guildId);
    await interaction.deferReply({ ephemeral });
    const ctx = await prepareContext(interaction);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();
    const key = interaction.options.getString("key");
    const lk = key ? { license_key: key } : {};

    try {
      if (sub === "add") {
        const subscription = interaction.options.getString("subscription");
        const days = interaction.options.getInteger("days");
        const deviceLimit = interaction.options.getInteger("device_limit") || 1;
        const note = interaction.options.getString("note") || "";
        const expiryDate = parseExpiryDays(days);

        await eliteRequest("license", "add", ctx.appName, {
          license_key: key,
          subscription,
          expiry_date: expiryDate,
          device_limit: deviceLimit,
          note,
        });

        await interaction.editReply({ embeds: [success("License added", [
          field("Key", `\`${key}\``, true),
          field("Subscription", subscription, true),
          field("Expires", formatExpiry(expiryDate), true),
          field("Device Limit", String(deviceLimit), true),
        ])] });

      } else if (sub === "generate") {
        const subscription = interaction.options.getString("subscription");
        const days = interaction.options.getInteger("days");
        const amount = interaction.options.getInteger("amount") || 1;
        const deviceLimit = interaction.options.getInteger("device_limit") || 1;
        const randomChars = interaction.options.getBoolean("random_chars") ?? true;
        const note = interaction.options.getString("note") || "";
        const expiryDate = parseExpiryDays(days);

        const data = await eliteRequest("license", "generate", ctx.appName, {
          subscription,
          expiry_date: expiryDate,
          amount,
          device_limit: deviceLimit,
          note,
          use_capital: randomChars,
          use_lowercase: randomChars,
          use_numbers: true,
        });

        const keys = Array.isArray(data.keys) ? data.keys : [];
        const keyList = keys.join("\n") || "-";

        try {
          await interaction.user.send({
            embeds: [info(`${keys.length} License(s) Generated`, [
              field("App", ctx.appName, true),
              field("Subscription", subscription, true),
              field("Expires", formatExpiry(expiryDate), true),
              field("Keys", `\`\`\`\n${keyList}\n\`\`\``),
            ])],
          });
        } catch {}

        await interaction.editReply({ embeds: [success(`${keys.length} license(s) generated`, [
          field("Subscription", subscription, true),
          field("Amount", String(keys.length), true),
          field("Expires", formatExpiry(expiryDate), true),
        ], "Keys sent to your DMs.")] });

      } else if (sub === "view") {
        const data = await eliteRequest("license", "info", ctx.appName, lk);
        const l = data.license || data;
        const daysLeft = l.expiry_date
          ? Math.max(0, Math.ceil((new Date(l.expiry_date) - Date.now()) / 86400000))
          : null;
        await interaction.editReply({ embeds: [info(`License: ${key}`, [
          field("Subscription", l.subscription_name || "-", true),
          field("Status", l.banned ? "🔴 Banned" : l.paused ? "🟡 Paused" : "🟢 Active", true),
          field("Email", l.email || "-", true),
          field("IP Address", l.ip_address || "-", true),
          field("Days Left", daysLeft !== null ? `${daysLeft} day(s)` : "-", true),
          field("Devices Used", `${l.used_devices ?? "-"} / ${l.max_devices ?? "-"}`, true),
          field("Expiry Date", formatExpiry(l.expiry_date), true),
          field("Date Created", l.date_created ? new Date(l.date_created).toLocaleDateString("en-GB") : "-", true),
          field("Last Login", l.last_login ? new Date(l.last_login).toLocaleString("en-GB") : "-", true),
          field("Application", ctx.appName, true),
          field("Note", l.note || "-"),
        ])] });

      } else if (sub === "delete") {
        await eliteRequest("license", "delete", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("License deleted")] });

      } else if (sub === "ban") {
        await eliteRequest("license", "ban", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("License banned")] });

      } else if (sub === "unban") {
        await eliteRequest("license", "unban", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("License unbanned")] });

      } else if (sub === "pause") {
        await eliteRequest("license", "pause", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("License paused")] });

      } else if (sub === "unpause") {
        await eliteRequest("license", "unpause", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("License unpaused")] });

      } else if (sub === "extend") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("license", "extend", ctx.appName, { ...lk, days });
        await interaction.editReply({ embeds: [success(`License extended by ${days} days`)] });

      } else if (sub === "shorten") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("license", "shorten", ctx.appName, { ...lk, days });
        await interaction.editReply({ embeds: [success(`License shortened by ${days} days`)] });

      } else if (sub === "edit") {
        const patch = {};
        const note = interaction.options.getString("note");
        const deviceLimit = interaction.options.getInteger("device_limit");
        const subscription = interaction.options.getString("subscription");
        if (note !== null) patch.note = note;
        if (deviceLimit !== null) patch.device_limit = deviceLimit;
        if (subscription !== null) patch.subscription = subscription;

        if (!Object.keys(patch).length) {
          return interaction.editReply({ embeds: [error("Provide at least one field to edit.")] });
        }

        await eliteRequest("license", "edit", ctx.appName, { ...lk, ...patch });
        await interaction.editReply({ embeds: [success("License updated")] });

      } else if (sub === "reset") {
        await eliteRequest("license", "reset_hwid", ctx.appName, lk);
        await interaction.editReply({ embeds: [success("HWID and IP reset for license")] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
