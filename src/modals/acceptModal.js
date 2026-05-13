const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } =
  require("discord.js");

module.exports = {
  customIdPattern: /^accept_/,

  async execute(interaction) {
    const appealId = interaction.customId.replace("accept_", "");

    const modal = new ModalBuilder()
      .setCustomId(`accept_modal_${appealId}`)
      .setTitle("Kabul Etme Sebebi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("accept_reason")
          .setLabel("Kabul etme sebebiniz:")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
