const { EmbedBuilder } = require("discord.js");

// Matches the AuthlyX dashboard palette (src/pages/app/Index.tsx and friends),
// not Discord's stock colors - keep this in sync if the site palette changes.
const BLUE = 0x3aaaff;   // primary accent
const GREEN = 0x4ade80;  // success
const RED = 0xf43f5e;    // danger
const YELLOW = 0xfbbf24; // warning

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
