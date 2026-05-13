const { Events } = require("discord.js");
const fs = require("fs");
const path = require("path");
const CONFIG = require("../config/config");
const { loadData } = require("../database/database");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const commandsPath = path.join(__dirname, "../commands");
      const commandFile = require(path.join(commandsPath, `${interaction.commandName}.js`));
      if (!commandFile) return;
      await commandFile.execute(interaction, client);
    }

    // BUTTONS
    if (interaction.isButton()) {
      const buttonsPath = path.join(__dirname, "../buttons");
      const buttonFiles = fs
        .readdirSync(buttonsPath)
        .filter((f) => f.endsWith(".js"));

      for (const file of buttonFiles) {
        const button = require(path.join(buttonsPath, file));
        if (button.customId === interaction.customId) {
          await button.execute(interaction, client);
          return;
        }
      }
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {
      const modalsPath = path.join(__dirname, "../modals");
      const modalFiles = fs
        .readdirSync(modalsPath)
        .filter((f) => f.endsWith(".js"));

      for (const file of modalFiles) {
        const modal = require(path.join(modalsPath, file));
        if (modal.customId === interaction.customId) {
          await modal.execute(interaction, client);
          return;
        }
        // Pattern match için
        if (
          modal.customIdPattern &&
          modal.customIdPattern.test(interaction.customId)
        ) {
          await modal.execute(interaction, client);
          return;
        }
      }
    }
  },
};
