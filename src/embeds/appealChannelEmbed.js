const { EmbedBuilder } = require("discord.js");

function buildAppealChannelEmbed() {
  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("📋 Ban Affı Başvurusu")
    .setDescription(
      [
        "**Ban affı başvurmak için aşağıdaki butona tıklayın!**",
        "",
        "Başvuru formunda şunları dolduracaksınız:",
        "```",
        "Roblox İsmi:",
        "Discord İsmi:",
        "Discord ID:",
        "Ban Sebebi (Dürüst şekilde yazın):",
        "Nereden Ban Yediniz:",
        "Ban Tarihi:",
        "```",
        "",
        "⚠️ **Not:** Maksimum 2 kere ban affı başvurabilirsiniz!",
      ].join("\n")
    )
    .setFooter({ text: "Eko Yıldız Ban Affı Sistemi" })
    .setTimestamp();
}

module.exports = { buildAppealChannelEmbed };
