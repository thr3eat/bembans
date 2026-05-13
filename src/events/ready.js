const { Events } = require("discord.js");
const CONFIG = require("../config/config");
const { buildAppealChannelEmbed } = require("../embeds/appealChannelEmbed");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const logger = require("../utils/logger");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.success(`Bot aktif: ${client.user.tag}`);
    await registerCommands(client);
    setTimeout(() => sendAppealChannelMessage(client), 3000);
  },
};

async function registerCommands(client) {
  const { REST, Routes } = require("discord.js");
  const fs = require("fs");
  const path = require("path");

  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  const commands = [];
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  try {
    logger.info("Slash commands kaydediliyor...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        CONFIG.MAIN_GUILD_ID
      ),
      { body: commands }
    );
    logger.success("Slash commands başarıyla kaydedildi!");
  } catch (err) {
    logger.error(`Command kayıt hatası: ${err}`);
  }
}

async function sendAppealChannelMessage(client) {
  try {
    const appealGuild = await client.guilds.fetch(CONFIG.APPEAL_GUILD_ID);
    const appealChannel = await appealGuild.channels.fetch(
      CONFIG.APPEAL_CHANNEL_ID
    );

    const embed = buildAppealChannelEmbed();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("appeal_apply")
        .setLabel("📝 Ban Affı Başvur")
        .setStyle(ButtonStyle.Primary)
    );

    // Kanalda zaten mesaj var mı kontrol et
    const messages = await appealChannel.messages.fetch({ limit: 10 });
    const existing = messages.find(
      (m) =>
        m.author.id === client.user.id &&
        m.embeds[0]?.title === "📋 Ban Affı Başvurusu"
    );

    if (!existing) {
      await appealChannel.send({ embeds: [embed], components: [row] });
      logger.success("Ban affı mesajı kanala gönderildi.");
    } else {
      logger.info("Ban affı mesajı zaten mevcut.");
    }
  } catch (err) {
    logger.error(`Appeal kanal mesajı gönderilemedi: ${err}`);
  }
}
