const { readFileSync, writeFileSync, mkdirSync, existsSync } = require("fs");
const { join } = require("path");

const DATA_DIR = join(__dirname, "../../data");
const DB_PATH = join(DATA_DIR, "bot.json");

mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!existsSync(DB_PATH)) return { guild_config: {}, app_selections: {} };
  try { return JSON.parse(readFileSync(DB_PATH, "utf8")); } catch { return { guild_config: {}, app_selections: {} }; }
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function setEphemeral(guildId, value) {
  const data = load();
  data.guild_config[guildId] = { ...(data.guild_config[guildId] || {}), ephemeral: value, updated_at: Date.now() };
  save(data);
}

function resolveEphemeral(guildId) {
  const config = load().guild_config[guildId];
  if (config && typeof config.ephemeral === "boolean") return config.ephemeral;
  return process.env.EPHEMERAL !== "false";
}

function getAppSelection(guildId, userId) {
  return load().app_selections[`${guildId}:${userId}`]?.app_name || null;
}

function setAppSelection(guildId, userId, appName) {
  const data = load();
  data.app_selections[`${guildId}:${userId}`] = { app_name: appName, updated_at: Date.now() };
  save(data);
}

function resolveApp(guildId, userId) {
  return getAppSelection(guildId, userId);
}

module.exports = { setEphemeral, resolveEphemeral, getAppSelection, setAppSelection, resolveApp };
