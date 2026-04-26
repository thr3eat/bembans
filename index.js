const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} = require("discord.js");
require("dotenv").config();
const fs = require("fs");

// ============================================================
//  CONFIG
// ============================================================
const CONFIG = {
  // Ana sunucu (ban yönetim sunucusu)
  MAIN_GUILD_ID: "1367646464804655104",
  // Ban mesajı yönetici kullanıcı ID
  ADMIN_USER_ID: "1031620522406072350",
  // Ban affı başvuru sunucusu
  APPEAL_GUILD_ID: "1417230761047752817",
  // Ban affı başvuru kanalı
  APPEAL_CHANNEL_ID: "1417230762616422489",
  // Ana sunucuda ban affı review kanalı
  REVIEW_CHANNEL_ID: "1498009677743788155",
  // Ban affı kabul linki
  ACCEPT_INVITE: "https://discord.gg/GPpqAueaCH",
  // Ban affı başvuru daveti
  APPEAL_INVITE: "https://discord.gg/FMF3sf9h4",
  // Maksimum ban affı hakkı
  MAX_APPEALS: 2,
};

// ============================================================
//  VERİ DEPOLAMA (JSON dosyası)
// ============================================================
const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ bans: {}, appeals: {} }));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
//  CLIENT
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// ============================================================
//  SLASH COMMANDS KAYIT
// ============================================================
const commands = [
  new SlashCommandBuilder()
    .setName("tumbanlananlaramesaj")
    .setDescription(
      "Tüm banlı kullanıcılara ban affı duyurusunu gönderir. (Sadece yetkili)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("banmesaj")
    .setDescription("Belirli bir banlı kullanıcıya ban mesajı gönderir.")
    .addIntegerOption((opt) =>
      opt
        .setName("ban_id")
        .setDescription("Ban ID numarası")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
].map((cmd) => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  try {
    console.log("📡 Slash commands kaydediliyor…");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        CONFIG.MAIN_GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ Slash commands başarıyla kaydedildi!");
  } catch (err) {
    console.error("❌ Command kayıt hatası:", err);
  }
}

// ============================================================
//  BAN MESAJI EMBED
// ============================================================
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

// ============================================================
//  READY
// ============================================================
client.once("ready", async () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
  await registerCommands();
});

// ============================================================
//  BAN ALGILAMA
// ============================================================
client.on("guildBanAdd", async (ban) => {
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
    const notifyEmbed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle("🔨 Yeni Ban Algılandı!")
      .setDescription(
        [
          `**Kullanıcı:** ${ban.user.tag} (\`${userId}\`)`,
          `**Ban ID:** #${banId}`,
          "",
          `Ban mesajı göndermek için ana sunucuda şu komutu kullanın:`,
          `\`/banmesaj ban_id:${banId}\``,
        ].join("\n")
      )
      .setTimestamp();

    await admin.send({ embeds: [notifyEmbed] });
  } catch (err) {
    console.error("Admin DM gönderilemedi:", err);
  }
});

// ============================================================
//  SLASH COMMAND HANDLER
// ============================================================
client.on("interactionCreate", async (interaction) => {
  // ─── SLASH COMMANDS ───────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    // /tumbanlananlaramesaj
    if (interaction.commandName === "tumbanlananlaramesaj") {
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
    }

    // /banmesaj
    if (interaction.commandName === "banmesaj") {
      if (interaction.user.id !== CONFIG.ADMIN_USER_ID) {
        return interaction.reply({
          content: "❌ Bu komutu kullanma yetkiniz yok!",
          ephemeral: true,
        });
      }

      const banId = interaction.options.getInteger("ban_id");
      const data = loadData();

      const banEntry = Object.values(data.bans).find(
        (b) => b.banId === banId
      );

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
    }
  }

  // ─── BUTON: Ban Affı Başvur ───────────────────────────────
  if (interaction.isButton() && interaction.customId === "appeal_apply") {
    const data = loadData();
    const userId = interaction.user.id;
    const appealCount = data.appeals[userId]
      ? Object.keys(data.appeals[userId]).length
      : 0;

    if (appealCount >= CONFIG.MAX_APPEALS) {
      return interaction.reply({
        content: `❌ Maksimum ban affı hakkınızı (${CONFIG.MAX_APPEALS}) kullandınız!`,
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("appeal_modal")
      .setTitle("Ban Affı Başvurusu");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("roblox_name")
          .setLabel("Roblox İsmi")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("discord_name")
          .setLabel("Discord İsmi")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_reason")
          .setLabel("Ban Sebebi (Dürüst yazın)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_source")
          .setLabel("Nereden Ban Yediniz?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ban_date")
          .setLabel("Ban Tarihi")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Örnek: 01.01.2024")
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }

  // ─── MODAL SUBMIT: Ban Affı Formu ─────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === "appeal_modal") {
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
    const reviewChannel = await mainGuild.channels.fetch(CONFIG.REVIEW_CHANNEL_ID);

    const reviewEmbed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle("📋 Yeni Ban Affı Başvurusu")
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "👤 Discord", value: `${interaction.user.tag} (\`${userId}\`)`, inline: true },
        { name: "🎮 Roblox İsmi", value: robloxName, inline: true },
        { name: "📝 Discord İsmi", value: discordName, inline: true },
        { name: "⛔ Ban Sebebi", value: banReason, inline: false },
        { name: "📍 Nereden Ban?", value: banSource, inline: true },
        { name: "📅 Ban Tarihi", value: banDate, inline: true },
        { name: "🔢 Başvuru No", value: `${appealCount}/${CONFIG.MAX_APPEALS}`, inline: true }
      )
      .setFooter({ text: `Appeal ID: ${appealId}` })
      .setTimestamp();

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
      content: "✅ Ban affı başvurunuz alındı! Sonuç DM olarak bildirilecektir.",
      ephemeral: true,
    });
  }

  // ─── BUTON: Kabul Et ──────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("accept_")) {
    const appealId = interaction.customId.replace("accept_", "");

    const modal = new ModalBuilder()
      .setCustomId(`accept_modal_${appealId}`)
      .setTitle("Kabul Etme Sebebi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("accept_reason")
          .setLabel("Kabul etme sebebiniz:")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }

  // ─── BUTON: Reddet ────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("reject_")) {
    const appealId = interaction.customId.replace("reject_", "");

    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${appealId}`)
      .setTitle("Red Etme Sebebi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reject_reason")
          .setLabel("Red etme sebebiniz:")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  }

  // ─── MODAL: Kabul Onayı ───────────────────────────────────
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("accept_modal_")
  ) {
    const appealId = interaction.customId.replace("accept_modal_", "");
    const reason = interaction.fields.getTextInputValue("accept_reason");
    const data = loadData();

    // Appeal bul
    let targetAppeal = null;
    let targetUserId = null;
    for (const [uid, appeals] of Object.entries(data.appeals)) {
      if (appeals[appealId]) {
        targetAppeal = appeals[appealId];
        targetUserId = uid;
        break;
      }
    }

    if (!targetAppeal) {
      return interaction.reply({ content: "❌ Başvuru bulunamadı!", ephemeral: true });
    }

    data.appeals[targetUserId][appealId].status = "accepted";
    saveData(data);

    // Ana sunucudan banı kaldır
    try {
      const mainGuild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
      await mainGuild.bans.remove(targetUserId, `Ban affı kabul edildi. Sebep: ${reason}`);
    } catch (err) {
      console.error("Ban kaldırma hatası:", err);
    }

    // Kullanıcıya DM
    try {
      const user = await client.users.fetch(targetUserId);
      const acceptEmbed = new EmbedBuilder()
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

      await user.send({ embeds: [acceptEmbed] });
    } catch (err) {
      console.error("Kullanıcıya DM gönderilemedi:", err);
    }

    // Review mesajını güncelle
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("✅ Kabul Edildi")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        ),
      ],
    });

    await interaction.reply({
      content: `✅ Ban affı kabul edildi ve kullanıcıya bildirildi!`,
      ephemeral: true,
    });
  }

  // ─── MODAL: Red Onayı ────────────────────────────────────
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("reject_modal_")
  ) {
    const appealId = interaction.customId.replace("reject_modal_", "");
    const reason = interaction.fields.getTextInputValue("reject_reason");
    const data = loadData();

    // Appeal bul
    let targetAppeal = null;
    let targetUserId = null;
    for (const [uid, appeals] of Object.entries(data.appeals)) {
      if (appeals[appealId]) {
        targetAppeal = appeals[appealId];
        targetUserId = uid;
        break;
      }
    }

    if (!targetAppeal) {
      return interaction.reply({ content: "❌ Başvuru bulunamadı!", ephemeral: true });
    }

    data.appeals[targetUserId][appealId].status = "rejected";
    saveData(data);

    const remainingAppeals =
      CONFIG.MAX_APPEALS - Object.keys(data.appeals[targetUserId]).length;
    const isLastAppeal = remainingAppeals <= 0;

    // Kullanıcıya DM
    try {
      const user = await client.users.fetch(targetUserId);
      const rejectEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle("❌ Ban Affınız Reddedildi!")
        .setDescription(
          [
            `**Ban affınız reddedildi.**`,
            "",
            `📋 **Sebep:** ${reason}`,
            "",
            isLastAppeal
              ? "⚠️ **Uyarı:** Maksimum ban affı hakkınızı kullandınız. Artık başvuru yapamazsınız."
              : `🔄 Tekrar ban affı atmayı deneyebilirsiniz.\n⚠️ **Uyarı:** Sadece ${remainingAppeals} ban affı hakkınız kaldı!`,
          ].join("\n")
        )
        .setTimestamp();

      await user.send({ embeds: [rejectEmbed] });
    } catch (err) {
      console.error("Kullanıcıya DM gönderilemedi:", err);
    }

    // Review mesajını güncelle
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("done")
            .setLabel("❌ Reddedildi")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        ),
      ],
    });

    await interaction.reply({
      content: `✅ Ban affı reddedildi ve kullanıcıya bildirildi!`,
      ephemeral: true,
    });
  }
});

// ============================================================
//  APPEAL KANAL MESAJI GÖNDER (Bot başladığında)
// ============================================================
async function sendAppealChannelMessage() {
  try {
    const appealGuild = await client.guilds.fetch(CONFIG.APPEAL_GUILD_ID);
    const appealChannel = await appealGuild.channels.fetch(CONFIG.APPEAL_CHANNEL_ID);

    const embed = new EmbedBuilder()
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
      console.log("✅ Ban affı mesajı kanala gönderildi.");
    } else {
      console.log("ℹ️ Ban affı mesajı zaten mevcut.");
    }
  } catch (err) {
    console.error("Appeal kanal mesajı gönderilemedi:", err);
  }
}

client.once("ready", () => {
  setTimeout(sendAppealChannelMessage, 3000);
});

const http = require("http");
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot aktif!");
}).listen(process.env.PORT || 3000);

// ============================================================
//  LOGIN
// ============================================================
client.login(process.env.BOT_TOKEN);
