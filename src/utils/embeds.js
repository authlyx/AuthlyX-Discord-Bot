const { EmbedBuilder } = require("discord.js");

const BLUE = 0x3aaaff;
const GREEN = 0x4ade80;
const RED = 0xf43f5e;
const YELLOW = 0xfbbf24;

const AUTHLYX_LOGO_URL = "https://cdn.authly.cc/logos/authlynobg.png";

function brand(embed) {
  return embed.setFooter({ text: "AuthlyX", iconURL: AUTHLYX_LOGO_URL });
}

function success(title, fields = [], description = null) {
  const e = new EmbedBuilder().setColor(GREEN).setTitle(title).setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  return brand(e);
}

function error(message) {
  return brand(new EmbedBuilder().setColor(RED).setTitle("Error").setDescription(message).setTimestamp());
}

function info(title, fields = [], description = null) {
  const e = new EmbedBuilder().setColor(BLUE).setTitle(title).setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  return brand(e);
}

function warn(title, description) {
  return brand(new EmbedBuilder().setColor(YELLOW).setTitle(title).setDescription(description).setTimestamp());
}

function field(name, value, inline = false) {
  return { name, value: String(value || "-"), inline };
}

module.exports = { success, error, info, warn, field, brand, BLUE, GREEN, RED, YELLOW, AUTHLYX_LOGO_URL };
