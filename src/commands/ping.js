const { SlashCommandBuilder } = require("discord.js");
const { pingApi } = require("../utils/api");
const { success, error, field } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's connection and AuthlyX API response time"),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const wsLatency = Math.round(interaction.client.ws.ping);

    const apiStart = Date.now();
    try {
      await pingApi();
      const apiLatency = Date.now() - apiStart;

      await interaction.editReply({
        embeds: [success("Pong!", [
          field("Discord Gateway", `${wsLatency >= 0 ? wsLatency : "-"}ms`, true),
          field("AuthlyX API", `${apiLatency}ms`, true),
        ])],
      });
    } catch (e) {
      await interaction.editReply({
        embeds: [error(`AuthlyX API is not responding: ${e.message}`)],
      });
    }
  },
};
