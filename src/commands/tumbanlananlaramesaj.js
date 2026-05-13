const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildBanMessageEmbed } = require("../embeds/banMessageEmbed");

module.exports = {
  name: "tumbanlananlaramesaj",
  data: new SlashCommandBuilder()
    .setName("tumbanlananlaramesaj")
    .setDescription(
      "Tüm banlı kullanıcılara ban affı duyurusunu gönderir. (Sadece yetkili)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    if (interaction.user.id !== CONFIG.ADMIN_USER_ID) {
      return interaction.reply({
        content: "❌ Bu komutu kullanma yetkiniz yok!",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
    const bans = await guild.bans.fetch();
    const data = loadData();
    let sent = 0;
    let skipped = 0;

    for (const [userId, banInfo] of bans) {
      if (data.bans[userId]?.messageSent) {
        skipped++;
        continue;
      }

      try {
        const user = await client.users.fetch(userId);
        await user.send({ embeds: [buildBanMessageEmbed()] });

        if (!data.bans[userId]) {
          const banId = Object.keys(data.bans).length + 1;
          data.bans[userId] = {
            banId,
            userId,
            tag: user.tag,
            messageSent: true,
            timestamp: Date.now(),
          };
        } else {
          data.bans[userId].messageSent = true;
        }
        sent++;
      } catch {
        skipped++;
      }
    }

    saveData(data);

    return interaction.editReply({
      content: `✅ **Tamamlandı!**\n📨 Gönderildi: **${sent}** kullanıcı\n⏭️ Atlandı (zaten gönderildi/DM kapalı): **${skipped}** kullanıcı`,
    });
  },
};
