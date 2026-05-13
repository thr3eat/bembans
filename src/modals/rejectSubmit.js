const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildRejectEmbed } = require("../embeds/rejectEmbed");

module.exports = {
  customIdPattern: /^reject_modal_/,

  async execute(interaction, client) {
    const appealId = interaction.customId.replace("reject_modal_", "");
    const reason = interaction.fields.getTextInputValue("reject_reason");
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

    data.appeals[targetUserId][appealId].status = "rejected";
    saveData(data);

    const remainingAppeals =
      CONFIG.MAX_APPEALS - Object.keys(data.appeals[targetUserId]).length;
    const isLastAppeal = remainingAppeals <= 0;

    // Kullanıcıya DM
    try {
      const user = await client.users.fetch(targetUserId);
      const rejectEmbed = buildRejectEmbed(reason, remainingAppeals, isLastAppeal);
      await user.send({ embeds: [rejectEmbed] });
    } catch (err) {
      console.error("Kullanıcıya DM gönderilemedi:", err);
    }

    // Review mesajını güncelle
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("❌ Reddedildi")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        ),
      ],
    });

    await interaction.reply({
      content: `✅ Ban affı reddedildi ve kullanıcıya bildirildi!`,
      ephemeral: true,
    });
  },
};
