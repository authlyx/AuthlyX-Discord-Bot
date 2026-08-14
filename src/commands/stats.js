const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { prepareContext } = require("../utils/context");
const { eliteRequest } = require("../utils/api");
const { error, info, field, AUTHLYX_LOGO_URL } = require("../utils/embeds");
const { fetch } = require("undici");

function buildChartUrl(series) {
  const labels = series.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const data = series.map(d => d.count);

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: "#3aaaff",
        backgroundColor: "rgba(58,170,255,0.15)",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#3aaaff",
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: "#64748b", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          ticks: { color: "#64748b", font: { size: 10 }, precision: 0 },
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: true,
        },
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${encoded}&width=500&height=180&backgroundColor=rgb(15%2C22%2C35)&devicePixelRatio=2`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show stats and usage chart for the selected app"),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const ctx = await prepareContext(interaction);
    if (!ctx) return;

    try {
      const [infoData, usageData] = await Promise.all([
        eliteRequest("app", "info", ctx.appName, {}),
        eliteRequest("app", "usage", ctx.appName, {}).catch(() => null),
      ]);

      const get = (...keys) => {
        for (const k of keys) {
          const v = infoData[k];
          if (v !== undefined && v !== null) return String(v);
        }
        return "-";
      };

      const embed = info(ctx.appName, [
        field("Users",         get("total_users"),         true),
        field("Licenses",      get("total_licenses"),      true),
        field("Devices",       get("total_devices"),       true),
        field("Subscriptions", get("total_subscriptions"), true),
        field("Variables",     get("total_variables"),     true),
        field("Plan",          get("plan_name"),           true),
        field("App Status",    infoData.is_enabled === false ? "🔴 Disabled" : "🟢 Enabled", true),
      ]);

      const series = usageData?.series;
      const hasUsage = Array.isArray(series) && series.some(d => d.count > 0);

      if (hasUsage) {
        embed.setImage("attachment://usage.png");
        embed.setFooter({ text: "AuthlyX • SDK calls - last 7 days", iconURL: AUTHLYX_LOGO_URL });

        const chartUrl = buildChartUrl(series);
        const imgRes = await fetch(chartUrl);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const attachment = new AttachmentBuilder(buffer, { name: "usage.png" });

        await interaction.editReply({ embeds: [embed], files: [attachment] });
      } else {
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (e) {
      await interaction.editReply({ embeds: [error(e.message)] });
    }
  },
};
