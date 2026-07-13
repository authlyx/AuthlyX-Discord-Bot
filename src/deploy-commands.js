const { REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
require("dotenv").config();

const commands = [];
const commandFiles = readdirSync(join(__dirname, "commands")).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const cmd = require(join(__dirname, "commands", file));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Commands registered globally.");
  } catch (e) {
    console.error(e);
  }
})();
