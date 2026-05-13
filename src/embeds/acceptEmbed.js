const { EmbedBuilder } = require("discord.js");
const CONFIG = require("../config/config");

function buildAcceptEmbed(reason) {
  return new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle("✅ Ban Affınız Kabul Edildi!")
    .setDescription(
      [
        `**Tebrikler! Ban affınız kabul edildi.**`,
        "",
        `🔗 **Sunucuya Katıl:** ${CONFIG.ACCEPT_INVITE}`,
        "",
        `📋 **Sebep:** ${reason}`,
        "",
        "💛 Tekrar aramıza hoşgeldiniz!",
      ].join("\n")
    )
    .setTimestamp();
}

module.exports = { buildAcceptEmbed };
