const { Events } = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildNotifyEmbed } = require("../embeds/notifyEmbed");

module.exports = {
  name: Events.GuildBanAdd,

  async execute(ban, client) {
    if (ban.guild.id !== CONFIG.MAIN_GUILD_ID) return;

    const data = loadData();
    const userId = ban.user.id;

    // Zaten bu kullanıcıya mesaj gönderildi mi?
    if (data.bans[userId]) return;

    // Ban kaydı oluştur
    const banId = Object.keys(data.bans).length + 1;
    data.bans[userId] = {
      banId,
      userId,
      tag: ban.user.tag,
      messageSent: false,
      timestamp: Date.now(),
    };
    saveData(data);

    // Yetkili kullanıcıya DM gönder
    try {
      const admin = await client.users.fetch(CONFIG.ADMIN_USER_ID);
      const notifyEmbed = buildNotifyEmbed(ban, banId);
      await admin.send({ embeds: [notifyEmbed] });
    } catch (err) {
      console.error("Admin DM gönderilemedi:", err);
    }
  },
};
