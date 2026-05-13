const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildAcceptEmbed } = require("../embeds/acceptEmbed");

module.exports = {
  customIdPattern: /^accept_modal_/,

  async execute(interaction, client) {
    const appealId = interaction.customId.replace("accept_modal_", "");
    const reason = interaction.fields.getTextInputValue("accept_reason");
    const data = loadData();

    // Appeal bul
    let targetAppeal = null;
    let targetUserId = null;
    for (const [uid, appeals] of Object.entries(data.appeals)) {
      if (appeals[appealId]) {
        targetAppeal = appeals[appealId];
        targetUserId = uid;
        break;
      }
    }

    if (!targetAppeal) {
      return interaction.reply({
        content: "❌ Başvuru bulunamadı!",
        ephemeral: true,
      });
    }

    data.appeals[targetUserId][appealId].status = "accepted";
    saveData(data);

    // Ana sunucudan banı kaldır
    try {
      const mainGuild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
      await mainGuild.bans.remove(
        targetUserId,
        `Ban affı kabul edildi. Sebep: ${reason}`
      );
    } catch (err) {
      console.error("Ban kaldırma hatası:", err);
    }

    // Kullanıcıya DM
    try {
      const user = await client.users.fetch(targetUserId);
      const acceptEmbed = buildAcceptEmbed(reason);
      await user.send({ embeds: [acceptEmbed] });
    } catch (err) {
      console.error("Kullanıcıya DM gönderilemedi:", err);
    }

    // Review mesajını güncelle
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("✅ Kabul Edildi")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        ),
      ],
    });

    await interaction.reply({
      content: `✅ Ban affı kabul edildi ve kullanıcıya bildirildi!`,
      ephemeral: true,
    });
  },
};
