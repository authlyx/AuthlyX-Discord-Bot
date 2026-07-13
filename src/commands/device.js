const { SlashCommandBuilder } = require("discord.js");
const { prepareContext } = require("../utils/context");
const { resolveEphemeral } = require("../utils/db");
const { eliteRequest } = require("../utils/api");
const { success, error, info, field } = require("../utils/embeds");
const { formatExpiry } = require("../utils/parseExpiry");

// options shared by all subcommands that target a single device
function addDeviceOptions(s) {
  return s
    .addStringOption(o => o.setName("device_type").setDescription("Device ID type").setRequired(true)
      .addChoices(
        { name: "Motherboard ID", value: "motherboard" },
        { name: "Processor ID",   value: "processor"   },
      ))
    .addStringOption(o => o.setName("device_id").setDescription("The device ID value").setRequired(true));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("device")
    .setDescription("Manage devices")
    .addSubcommand(s => s.setName("list").setDescription("List devices in the current app")
      .addStringOption(o => o.setName("subscription").setDescription("Filter by subscription name (optional)")))
    .addSubcommand(s => addDeviceOptions(s.setName("view").setDescription("View a specific device")))
    .addSubcommand(s => addDeviceOptions(s.setName("delete").setDescription("Remove a device")))
    .addSubcommand(s => addDeviceOptions(s.setName("reset").setDescription("Reset HWID and IP for a specific device")))
    .addSubcommand(s => addDeviceOptions(s.setName("ban").setDescription("Ban a device")))
    .addSubcommand(s => addDeviceOptions(s.setName("unban").setDescription("Unban a device")))
    .addSubcommand(s => addDeviceOptions(s.setName("pause").setDescription("Pause a device")))
    .addSubcommand(s => addDeviceOptions(s.setName("unpause").setDescription("Unpause a device")))
    .addSubcommand(s => addDeviceOptions(
      s.setName("extend").setDescription("Extend device expiry")
        .addIntegerOption(o => o.setName("days").setDescription("Days to add").setRequired(true))
    ))
    .addSubcommand(s => addDeviceOptions(
      s.setName("shorten").setDescription("Shorten device expiry")
        .addIntegerOption(o => o.setName("days").setDescription("Days to remove").setRequired(true))
    )),

  async execute(interaction) {
    const ephemeral = resolveEphemeral(interaction.guildId);
    await interaction.deferReply({ ephemeral });
    const ctx = await prepareContext(interaction);
    if (!ctx) return;

    const sub = interaction.options.getSubcommand();
    const deviceType = interaction.options.getString("device_type");
    const deviceId   = interaction.options.getString("device_id");

    // params for single-device actions
    const deviceParams = deviceType && deviceId
      ? { device_type: deviceType, device_id: deviceId }
      : {};

    try {
      if (sub === "list") {
        const subscription = interaction.options.getString("subscription") || "";
        const data = await eliteRequest("device", "list", ctx.appName, subscription ? { subscription } : {});
        const devices = Array.isArray(data.devices) ? data.devices : [];
        if (!devices.length) return interaction.editReply({ embeds: [info("No devices found")] });
        const lines = devices.map(d =>
          `\`${d.device_id}\` (${d.device_type || "-"}) - ${d.banned ? "🔴 Banned" : d.paused ? "🟡 Paused" : "🟢 Active"}`
        ).join("\n").slice(0, 4000);
        await interaction.editReply({ embeds: [info(`Devices (${devices.length})`, [], lines)] });

      } else if (sub === "view") {
        const data = await eliteRequest("device", "info", ctx.appName, deviceParams);
        const d = data.device || data;
        await interaction.editReply({ embeds: [info(`Device: ${deviceId}`, [
          field("Type",         d.device_type || deviceType || "-", true),
          field("Subscription", d.subscription_name || "-", true),
          field("Expiry",       formatExpiry(d.expiry_date), true),
          field("Activated",    d.activated ? "Yes" : "No", true),
          field("Status",       d.banned ? "🔴 Banned" : d.paused ? "🟡 Paused" : "🟢 Active", true),
        ])] });

      } else if (sub === "delete") {
        await eliteRequest("device", "delete", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device removed")] });

      } else if (sub === "reset") {
        await eliteRequest("device", "reset", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device HWID and IP reset")] });

      } else if (sub === "ban") {
        await eliteRequest("device", "ban", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device banned")] });

      } else if (sub === "unban") {
        await eliteRequest("device", "unban", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device unbanned")] });

      } else if (sub === "pause") {
        await eliteRequest("device", "pause", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device paused")] });

      } else if (sub === "unpause") {
        await eliteRequest("device", "unpause", ctx.appName, deviceParams);
        await interaction.editReply({ embeds: [success("Device unpaused")] });

      } else if (sub === "extend") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("device", "extend", ctx.appName, { ...deviceParams, days });
        await interaction.editReply({ embeds: [success(`Device extended by ${days} days`)] });

      } else if (sub === "shorten") {
        const days = interaction.options.getInteger("days");
        await eliteRequest("device", "shorten", ctx.appName, { ...deviceParams, days });
        await interaction.editReply({ embeds: [success(`Device shortened by ${days} days`)] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
