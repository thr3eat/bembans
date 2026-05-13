const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildBanMessageEmbed } = require("../embeds/banMessageEmbed");

module.exports = {
  name: "banmesaj",
  data: new SlashCommandBuilder()
    .setName("banmesaj")
    .setDescription("Belirli bir banlı kullanıcıya ban mesajı gönderir.")
    .addIntegerOption((opt) =>
      opt
        .setName("ban_id")
        .setDescription("Ban ID numarası")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    if (interaction.user.id !== CONFIG.ADMIN_USER_ID) {
      return interaction.reply({
        content: "❌ Bu komutu kullanma yetkiniz yok!",
        ephemeral: true,
      });
    }

    const banId = interaction.options.getInteger("ban_id");
    const data = loadData();

    const banEntry = Object.values(data.bans).find((b) => b.banId === banId);

    if (!banEntry) {
      return interaction.reply({
        content: `❌ #${banId} ID'li ban kaydı bulunamadı!`,
        ephemeral: true,
      });
    }

    if (banEntry.messageSent) {
      return interaction.reply({
        content: `⚠️ Bu kullanıcıya zaten ban affı mesajı gönderildi!`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await client.users.fetch(banEntry.userId);
      await user.send({ embeds: [buildBanMessageEmbed()] });
      data.bans[banEntry.userId].messageSent = true;
      saveData(data);

      return interaction.editReply({
        content: `✅ **${user.tag}** kullanıcısına ban affı mesajı gönderildi!`,
      });
    } catch {
      return interaction.editReply({
        content: `❌ Kullanıcıya DM gönderilemedi (DM'leri kapalı olabilir).`,
      });
    }
  },
};
