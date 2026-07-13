const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { setAppSelection } = require("./utils/db");
const { success, error } = require("./utils/embeds");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandFiles = readdirSync(join(__dirname, "commands")).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(join(__dirname, "commands", file));
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (interaction.isButton() && interaction.customId.startsWith("app_select:")) {
    const appName = interaction.customId.slice("app_select:".length);
    try {
      setAppSelection(interaction.guildId, interaction.user.id, appName);
      await interaction.update({ embeds: [success(`App set to **${appName}**`)], components: [] });
    } catch (e) {
      await interaction.update({ embeds: [error(e.message)], components: [] });
    }
    return;
  }

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  if (interaction.isAutocomplete()) {
    try {
      if (cmd.autocomplete) await cmd.autocomplete(interaction);
    } catch (e) {
      console.error("[autocomplete]", e);
      await interaction.respond([]).catch(() => {});
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error(e);
    const msg = { content: "❌ An unexpected error occurred.", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
