const { EmbedBuilder } = require("discord.js");
const CONFIG = require("../config/config");

function buildRejectEmbed(reason, remainingAppeals, isLastAppeal) {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("❌ Ban Affınız Reddedildi!")
    .setDescription(
      [
        `**Ban affınız reddedildi.**`,
        "",
        `📋 **Sebep:** ${reason}`,
        "",
        isLastAppeal
          ? "⚠️ **Uyarı:** Maksimum ban affı hakkınızı kullandınız. Artık başvuru yapamazsınız."
          : `🔄 Tekrar ban affı atmayı deneyebilirsiniz.\n⚠️ **Uyarı:** Sadece ${remainingAppeals} ban affı hakkınız kaldı!`,
      ].join("\n")
    )
    .setTimestamp();
}

module.exports = { buildRejectEmbed };
