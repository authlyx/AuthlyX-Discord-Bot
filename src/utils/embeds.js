const { EmbedBuilder } = require("discord.js");

const BLUE = 0x080fd4;
const GREEN = 0x08d42d;
const RED = 0xd40f08;
const YELLOW = 0xeaed13;

function success(title, fields = [], description = null) {
  const e = new EmbedBuilder().setColor(GREEN).setTitle(`✅ ${title}`).setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  return e;
}

function error(message) {
  return new EmbedBuilder().setColor(RED).setTitle("❌ Error").setDescription(message).setTimestamp();
}

function info(title, fields = [], description = null) {
  const e = new EmbedBuilder().setColor(BLUE).setTitle(title).setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  return e;
}

function warn(title, description) {
  return new EmbedBuilder().setColor(YELLOW).setTitle(`⚠️ ${title}`).setDescription(description).setTimestamp();
}

function field(name, value, inline = false) {
  return { name, value: String(value || "-"), inline };
}

module.exports = { success, error, info, warn, field, BLUE, GREEN, RED, YELLOW };
