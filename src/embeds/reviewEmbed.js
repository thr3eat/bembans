const { EmbedBuilder } = require("discord.js");
const CONFIG = require("../config/config");

function buildReviewEmbed(
  interaction,
  robloxName,
  discordName,
  banReason,
  banSource,
  banDate,
  appealId,
  appealCount
) {
  return new EmbedBuilder()
    .setColor(0x3b82f6)
    .setTitle("📋 Yeni Ban Affı Başvurusu")
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      {
        name: "👤 Discord",
        value: `${interaction.user.tag} (\`${interaction.user.id}\`)`,
        inline: true,
      },
      { name: "🎮 Roblox İsmi", value: robloxName, inline: true },
      { name: "📝 Discord İsmi", value: discordName, inline: true },
      { name: "⛔ Ban Sebebi", value: banReason, inline: false },
      { name: "📍 Nereden Ban?", value: banSource, inline: true },
      { name: "📅 Ban Tarihi", value: banDate, inline: true },
      {
        name: "🔢 Başvuru No",
        value: `${appealCount}/${CONFIG.MAX_APPEALS}`,
        inline: true,
      }
    )
    .setFooter({ text: `Appeal ID: ${appealId}` })
    .setTimestamp();
}

module.exports = { buildReviewEmbed };
