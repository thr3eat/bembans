const { EmbedBuilder } = require("discord.js");
const CONFIG = require("../config/config");

function buildBanMessageEmbed() {
  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("🌟 Eko Yıldız Ban Affı Duyurusu")
    .setDescription(
      [
        "**Eko Yıldız artık ban affı yaptı!**",
        "",
        "Eğer banlamanızın açılmasını istiyorsanız:",
        `📌 **Sunucuya katılın:** ${CONFIG.APPEAL_INVITE}`,
        `📝 **Başvuru kanalı:** <#${CONFIG.APPEAL_CHANNEL_ID}>`,
        "",
        "**Başvuru Formatı:**",
        "```",
        "Roblox İsmi:",
        "Discord İsmi:",
        "Discord ID:",
        "Ban Sebebi (Dürüst şekilde yazın, zaten herkesin ban sebebi kayıtlı):",
        "Nereden Ban Yediniz:",
        "Ban Tarihi:",
        "```",
        "",
        "Formu doldurduktan sonra DM'den gelecek bilgiler için bekleyin.",
        "",
        "💛 **Sizi tekrar aramızda görmek için sabırsızlanıyoruz!**",
      ].join("\n")
    )
    .setFooter({ text: "Eko Yıldız Ban Affı Sistemi" })
    .setTimestamp();
}

module.exports = { buildBanMessageEmbed };
