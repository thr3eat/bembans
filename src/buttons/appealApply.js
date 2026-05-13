const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } =
  require("discord.js");

module.exports = {
  customId: "appeal_apply",

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("appeal_modal")
      .setTitle("Ban Affı Başvurusu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("roblox_name")
          .setLabel("Roblox İsmi")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("discord_name")
          .setLabel("Discord İsmi")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_reason")
          .setLabel("Ban Sebebi (Dürüst yazın)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_source")
          .setLabel("Nereden Ban Yediniz?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_date")
          .setLabel("Ban Tarihi")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örnek: 01.01.2024")
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
