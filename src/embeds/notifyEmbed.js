const { EmbedBuilder } = require("discord.js");

function buildNotifyEmbed(ban, banId) {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("🔨 Yeni Ban Algılandı!")
    .setDescription(
      [
        `**Kullanıcı:** ${ban.user.tag} (\`${ban.user.id}\`)`,
        `**Ban ID:** #${banId}`,
        "",
        `Ban mesajı göndermek için ana sunucuda şu komutu kullanın:`,
        `\`/banmesaj ban_id:${banId}\``,
      ].join("\n")
    )
    .setTimestamp();
}

module.exports = { buildNotifyEmbed };
