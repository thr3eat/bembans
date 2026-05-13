const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } =
  require("discord.js");

module.exports = {
  customIdPattern: /^reject_/,

  async execute(interaction) {
    const appealId = interaction.customId.replace("reject_", "");

    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${appealId}`)
      .setTitle("Red Etme Sebebi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reject_reason")
          .setLabel("Red etme sebebiniz:")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
