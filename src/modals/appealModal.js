const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const CONFIG = require("../config/config");
const { loadData, saveData } = require("../database/database");
const { buildReviewEmbed } = require("../embeds/reviewEmbed");

module.exports = {
  customId: "appeal_modal",

  async execute(interaction, client) {
    const data = loadData();
    const userId = interaction.user.id;

    const robloxName = interaction.fields.getTextInputValue("roblox_name");
    const discordName = interaction.fields.getTextInputValue("discord_name");
    const banReason = interaction.fields.getTextInputValue("ban_reason");
    const banSource = interaction.fields.getTextInputValue("ban_source");
    const banDate = interaction.fields.getTextInputValue("ban_date");

    // Appeal kaydı
    if (!data.appeals[userId]) data.appeals[userId] = {};
    const appealId = `${userId}_${Date.now()}`;
    const appealCount = Object.keys(data.appeals[userId]).length + 1;

    data.appeals[userId][appealId] = {
      appealId,
      appealCount,
      userId,
      tag: interaction.user.tag,
      robloxName,
      discordName,
      banReason,
      banSource,
      banDate,
      status: "pending",
      timestamp: Date.now(),
    };
    saveData(data);

    // Review kanalına gönder
    const mainGuild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
    const reviewChannel = await mainGuild.channels.fetch(
      CONFIG.REVIEW_CHANNEL_ID
    );

    const reviewEmbed = buildReviewEmbed(
      interaction,
      robloxName,
      discordName,
      banReason,
      banSource,
      banDate,
      appealId,
      appealCount
    );

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${appealId}`)
        .setLabel("✅ Kabul Et")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_${appealId}`)
        .setLabel("❌ Reddet")
        .setStyle(ButtonStyle.Danger)
    );

    await reviewChannel.send({ embeds: [reviewEmbed], components: [actionRow] });

    await interaction.reply({
      content:
        "✅ Ban affı başvurunuz alındı! Sonuç DM olarak bildirilecektir.",
      ephemeral: true,
    });
  },
};
