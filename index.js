const {
  Client,
  GatewayIntentBits,
  Partials,
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
  MAIN_GUILD_ID: "1367646464804655104",
  ADMIN_USER_ID: "1031620522406072350",
  APPEAL_GUILD_ID: "1417230761047752817",
  APPEAL_CHANNEL_ID: "1417230762616422489",
  REVIEW_CHANNEL_ID: "1498009677743788155",
  ACCEPT_INVITE: "https://discord.gg/GPpqAueaCH",
  APPEAL_INVITE: "https://discord.gg/FMF3sf9h4",
  MAX_APPEALS: 2,
  // DM gönderimi arasındaki bekleme süresi (ms) - rate limit için
  DM_DELAY: 1000,
};

// ============================================================
//  VERİ DEPOLAMA
// ============================================================
const DATA_FILE = "./data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ bans: {}, appeals: {}, logs: [] })
    );
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE));
  if (!raw.logs) raw.logs = [];
  return raw;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Log kaydı ekle
function addLog(data, type, details) {
  if (!data.logs) data.logs = [];
  data.logs.unshift({
    type,
    details,
    timestamp: Date.now(),
  });
  // Son 500 logu tut
  if (data.logs.length > 500) data.logs = data.logs.slice(0, 500);
}

// Sleep yardımcı fonksiyon
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
//  SLASH COMMANDS
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

  new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("Kayıtlı tüm banları listeler.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("appeallist")
    .setDescription("Tüm ban affı başvurularını listeler.")
    .addStringOption((opt) =>
      opt
        .setName("durum")
        .setDescription("Filtrele: pending / accepted / rejected / all")
        .setRequired(false)
        .addChoices(
          { name: "Bekleyenler", value: "pending" },
          { name: "Kabul Edilenler", value: "accepted" },
          { name: "Reddedilenler", value: "rejected" },
          { name: "Hepsi", value: "all" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("istatistik")
    .setDescription("Bot istatistiklerini gösterir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("appealiptal")
    .setDescription("Bir kullanıcının tüm ban affı haklarını sıfırlar.")
    .addStringOption((opt) =>
      opt
        .setName("kullanici_id")
        .setDescription("Kullanıcı Discord ID")
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
//  DM GÖNDERME YARDIMCI FONKSİYON (hata detaylı)
// ============================================================
async function sendDM(userId, payload) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(payload);
    return { success: true, user };
  } catch (err) {
    let reason = "Bilinmeyen hata";
    if (err.code === 50007) reason = "DM'leri kapalı";
    else if (err.code === 10013) reason = "Kullanıcı bulunamadı";
    else if (err.code === 40001) reason = "Yetkilendirme hatası";
    else if (err.status === 429) reason = "Rate limit - çok hızlı gönderim";
    else if (err.message) reason = err.message;
    return { success: false, reason, code: err.code };
  }
}

// ============================================================
//  READY
// ============================================================
client.once("ready", async () => {
  console.log(`✅ Bot aktif: ${client.user.username}`);
  await registerCommands();
  setTimeout(sendAppealChannelMessage, 3000);
});

// ============================================================
//  BAN ALGILAMA
// ============================================================
client.on("guildBanAdd", async (ban) => {
  if (ban.guild.id !== CONFIG.MAIN_GUILD_ID) return;

  const data = loadData();
  const userId = ban.user.id;

  if (data.bans[userId]) return;

  const banId = Object.keys(data.bans).length + 1;
  data.bans[userId] = {
    banId,
    userId,
    username: ban.user.username,
    messageSent: false,
    timestamp: Date.now(),
  };

  addLog(data, "BAN_ADD", `${ban.user.username} (${userId}) banlandı. Ban ID: #${banId}`);
  saveData(data);

  // Admin'e bildir
  const result = await sendDM(CONFIG.ADMIN_USER_ID, {
    embeds: [
      new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle("🔨 Yeni Ban Algılandı!")
        .setDescription(
          [
            `**Kullanıcı:** ${ban.user.username} (\`${userId}\`)`,
            `**Ban ID:** #${banId}`,
            "",
            `Ban mesajı göndermek için:`,
            `\`/banmesaj ban_id:${banId}\``,
          ].join("\n")
        )
        .setTimestamp(),
    ],
  });

  if (!result.success) {
    console.error(`Admin DM gönderilemedi: ${result.reason}`);
  }
});

// ============================================================
//  BAN KALDIRILMA (unban)
// ============================================================
client.on("guildBanRemove", async (ban) => {
  if (ban.guild.id !== CONFIG.MAIN_GUILD_ID) return;

  const data = loadData();
  const userId = ban.user.id;

  if (data.bans[userId]) {
    data.bans[userId].unbanned = true;
    data.bans[userId].unbanTimestamp = Date.now();
    addLog(data, "BAN_REMOVE", `${ban.user.username} (${userId}) banı kaldırıldı.`);
    saveData(data);
  }
});

// ============================================================
//  SLASH COMMAND HANDLER
// ============================================================
client.on("interactionCreate", async (interaction) => {

  // ─── SLASH COMMANDS ───────────────────────────────────────
  if (interaction.isChatInputCommand()) {

    // Yetki kontrolü (admin komutları)
    const adminCommands = ["tumbanlananlaramesaj", "banmesaj", "banlist", "appeallist", "istatistik", "appealiptal"];
    if (adminCommands.includes(interaction.commandName) && interaction.user.id !== CONFIG.ADMIN_USER_ID) {
      return interaction.reply({ content: "❌ Bu komutu kullanma yetkiniz yok!", ephemeral: true });
    }

    // ── /tumbanlananlaramesaj ──────────────────────────────
    if (interaction.commandName === "tumbanlananlaramesaj") {
      await interaction.deferReply({ ephemeral: true });

      const guild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
      const bans = await guild.bans.fetch();
      const data = loadData();

      let sent = 0;
      let skipped = 0;
      let dmClosed = 0;
      let notFound = 0;
      let otherError = 0;
      const errorDetails = [];

      // İlerleme mesajı
      await interaction.editReply({
        content: `⏳ İşlem başladı... Toplam **${bans.size}** banlı kullanıcı bulundu.`,
      });

      for (const [userId, banInfo] of bans) {
        if (data.bans[userId]?.messageSent) {
          skipped++;
          continue;
        }

        const result = await sendDM(userId, { embeds: [buildBanMessageEmbed()] });

        if (result.success) {
          if (!data.bans[userId]) {
            const banId = Object.keys(data.bans).length + 1;
            data.bans[userId] = {
              banId,
              userId,
              username: result.user.username,
              messageSent: true,
              timestamp: Date.now(),
            };
          } else {
            data.bans[userId].messageSent = true;
          }
          sent++;
        } else {
          if (result.reason === "DM'leri kapalı") dmClosed++;
          else if (result.reason === "Kullanıcı bulunamadı") notFound++;
          else {
            otherError++;
            errorDetails.push(`\`${userId}\`: ${result.reason}`);
          }
          skipped++;
        }

        // Her 5 kullanıcıda bir kaydet
        if ((sent + skipped) % 5 === 0) saveData(data);

        await sleep(CONFIG.DM_DELAY);
      }

      saveData(data);
      addLog(data, "BULK_DM", `Toplu mesaj: ${sent} gönderildi, ${skipped} atlandı.`);
      saveData(data);

      const lines = [
        `✅ **Tamamlandı!**`,
        `📨 Gönderildi: **${sent}** kullanıcı`,
        `⏭️ Zaten gönderilmişti: **${skipped - dmClosed - notFound - otherError}** kullanıcı`,
        `🔒 DM kapalı: **${dmClosed}** kullanıcı`,
        `👻 Kullanıcı bulunamadı: **${notFound}** kullanıcı`,
      ];
      if (otherError > 0) lines.push(`⚠️ Diğer hata: **${otherError}** kullanıcı`);
      if (errorDetails.length > 0) lines.push(`\n**Hata detayları:**\n${errorDetails.slice(0, 5).join("\n")}`);

      return interaction.editReply({ content: lines.join("\n") });
    }

    // ── /banmesaj ─────────────────────────────────────────
    if (interaction.commandName === "banmesaj") {
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
          content: `⚠️ Bu kullanıcıya (**${banEntry.username}**) zaten ban affı mesajı gönderildi!`,
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await sendDM(banEntry.userId, { embeds: [buildBanMessageEmbed()] });

      if (result.success) {
        data.bans[banEntry.userId].messageSent = true;
        addLog(data, "DM_SENT", `${banEntry.username} (${banEntry.userId}) ban affı mesajı gönderildi.`);
        saveData(data);
        return interaction.editReply({
          content: `✅ **${result.user.username}** kullanıcısına ban affı mesajı gönderildi!`,
        });
      } else {
        addLog(data, "DM_FAIL", `${banEntry.username} (${banEntry.userId}) DM gönderilemedi: ${result.reason}`);
        saveData(data);

        let errorMsg = `❌ Kullanıcıya DM gönderilemedi!\n**Sebep:** ${result.reason}`;
        if (result.code) errorMsg += ` (Kod: ${result.code})`;

        return interaction.editReply({ content: errorMsg });
      }
    }

    // ── /banlist ──────────────────────────────────────────
    if (interaction.commandName === "banlist") {
      const data = loadData();
      const bans = Object.values(data.bans);

      if (bans.length === 0) {
        return interaction.reply({ content: "📋 Kayıtlı ban bulunmuyor.", ephemeral: true });
      }

      const lines = bans.slice(0, 20).map((b) => {
        const status = b.messageSent ? "✅" : "❌";
        const unbanned = b.unbanned ? " *(Banı kaldırıldı)*" : "";
        return `**#${b.banId}** ${status} \`${b.userId}\` — ${b.username || "Bilinmiyor"}${unbanned}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle(`📋 Ban Listesi (${bans.length} kayıt)`)
        .setDescription(lines.join("\n"))
        .setFooter({ text: "✅ = Mesaj gönderildi | ❌ = Gönderilmedi" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── /appeallist ───────────────────────────────────────
    if (interaction.commandName === "appeallist") {
      const data = loadData();
      const filter = interaction.options.getString("durum") || "pending";

      const allAppeals = [];
      for (const [uid, appeals] of Object.entries(data.appeals)) {
        for (const [aid, appeal] of Object.entries(appeals)) {
          allAppeals.push(appeal);
        }
      }

      const filtered = filter === "all"
        ? allAppeals
        : allAppeals.filter((a) => a.status === filter);

      if (filtered.length === 0) {
        return interaction.reply({
          content: `📋 **${filter}** durumunda başvuru bulunmuyor.`,
          ephemeral: true,
        });
      }

      const statusEmoji = { pending: "⏳", accepted: "✅", rejected: "❌" };
      const lines = filtered.slice(0, 15).map((a) => {
        const emoji = statusEmoji[a.status] || "❓";
        const date = new Date(a.timestamp).toLocaleDateString("tr-TR");
        return `${emoji} \`${a.userId}\` — **${a.tag || a.userId}** | ${date} | ${a.appealCount}. başvuru`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`📋 Ban Affı Listesi — ${filter.toUpperCase()} (${filtered.length})`)
        .setDescription(lines.join("\n"))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── /istatistik ───────────────────────────────────────
    if (interaction.commandName === "istatistik") {
      const data = loadData();
      const bans = Object.values(data.bans);
      const allAppeals = [];
      for (const appeals of Object.values(data.appeals)) {
        for (const a of Object.values(appeals)) allAppeals.push(a);
      }

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle("📊 Bot İstatistikleri")
        .addFields(
          { name: "🔨 Toplam Ban Kaydı", value: `${bans.length}`, inline: true },
          { name: "📨 Mesaj Gönderilen", value: `${bans.filter((b) => b.messageSent).length}`, inline: true },
          { name: "🔓 Banı Kaldırılan", value: `${bans.filter((b) => b.unbanned).length}`, inline: true },
          { name: "📋 Toplam Başvuru", value: `${allAppeals.length}`, inline: true },
          { name: "⏳ Bekleyen", value: `${allAppeals.filter((a) => a.status === "pending").length}`, inline: true },
          { name: "✅ Kabul Edilen", value: `${allAppeals.filter((a) => a.status === "accepted").length}`, inline: true },
          { name: "❌ Reddedilen", value: `${allAppeals.filter((a) => a.status === "rejected").length}`, inline: true },
          { name: "⏱️ Bot Uptime", value: `${Math.floor(process.uptime() / 60)} dakika`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── /appealiptal ──────────────────────────────────────
    if (interaction.commandName === "appealiptal") {
      const targetId = interaction.options.getString("kullanici_id");
      const data = loadData();

      if (!data.appeals[targetId] || Object.keys(data.appeals[targetId]).length === 0) {
        return interaction.reply({
          content: `❌ \`${targetId}\` ID'li kullanıcının başvurusu bulunamadı!`,
          ephemeral: true,
        });
      }

      const count = Object.keys(data.appeals[targetId]).length;
      delete data.appeals[targetId];
      addLog(data, "APPEAL_RESET", `${targetId} kullanıcısının ${count} başvurusu sıfırlandı.`);
      saveData(data);

      return interaction.reply({
        content: `✅ \`${targetId}\` kullanıcısının **${count}** başvurusu sıfırlandı. Yeniden başvurabilir.`,
        ephemeral: true,
      });
    }
  }

  // ─── BUTON: Ban Affı Başvur ───────────────────────────────
  if (interaction.isButton() && interaction.customId === "appeal_apply") {
    const data = loadData();
    const userId = interaction.user.id;
    const userAppeals = data.appeals[userId] || {};
    const appealCount = Object.keys(userAppeals).length;

    // Zaten kabul edilmiş bir başvurusu var mı?
    const hasAccepted = Object.values(userAppeals).some((a) => a.status === "accepted");
    if (hasAccepted) {
      return interaction.reply({
        content: "✅ Daha önce ban affınız kabul edildi. Tekrar başvuramazsınız.",
        ephemeral: true,
      });
    }

    if (appealCount >= CONFIG.MAX_APPEALS) {
      return interaction.reply({
        content: `❌ Maksimum ban affı hakkınızı (${CONFIG.MAX_APPEALS}) kullandınız!`,
        ephemeral: true,
      });
    }

    // Bekleyen başvurusu var mı?
    const hasPending = Object.values(userAppeals).some((a) => a.status === "pending");
    if (hasPending) {
      return interaction.reply({
        content: "⏳ Zaten incelenmekte olan bir başvurunuz var! Lütfen sonucu bekleyin.",
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

    if (!data.appeals[userId]) data.appeals[userId] = {};
    const appealId = `${userId}_${Date.now()}`;
    const appealCount = Object.keys(data.appeals[userId]).length + 1;

    data.appeals[userId][appealId] = {
      appealId,
      appealCount,
      userId,
      tag: interaction.user.username,
      robloxName,
      discordName,
      banReason,
      banSource,
      banDate,
      status: "pending",
      timestamp: Date.now(),
    };

    addLog(data, "APPEAL_SUBMIT", `${interaction.user.username} (${userId}) ban affı başvurdu. (#${appealCount})`);
    saveData(data);

    // Review kanalına gönder
    try {
      const mainGuild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
      const reviewChannel = await mainGuild.channels.fetch(CONFIG.REVIEW_CHANNEL_ID);

      const remainingAfter = CONFIG.MAX_APPEALS - appealCount;

      const reviewEmbed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle("📋 Yeni Ban Affı Başvurusu")
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "👤 Discord", value: `${interaction.user.username} (\`${userId}\`)`, inline: true },
          { name: "🎮 Roblox İsmi", value: robloxName, inline: true },
          { name: "📝 Discord İsmi", value: discordName, inline: true },
          { name: "⛔ Ban Sebebi", value: banReason, inline: false },
          { name: "📍 Nereden Ban?", value: banSource, inline: true },
          { name: "📅 Ban Tarihi", value: banDate, inline: true },
          {
            name: "🔢 Başvuru No",
            value: `${appealCount}/${CONFIG.MAX_APPEALS} (${remainingAfter} hak kaldı)`,
            inline: true,
          }
        )
        .setFooter({ text: `Appeal ID: ${appealId}` })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept__${appealId}`)
          .setLabel("✅ Kabul Et")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject__${appealId}`)
          .setLabel("❌ Reddet")
          .setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({ embeds: [reviewEmbed], components: [actionRow] });
    } catch (err) {
      console.error("Review kanalına gönderilemedi:", err);
    }

    await interaction.reply({
      content: `✅ Ban affı başvurunuz alındı! (**${appealCount}/${CONFIG.MAX_APPEALS}** hakkınızı kullandınız)\nSonuç DM olarak bildirilecektir.`,
      ephemeral: true,
    });
  }

  // ─── BUTON: Kabul Et ──────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("accept__")) {
    const appealId = interaction.customId.slice("accept__".length);

    const modal = new ModalBuilder()
      .setCustomId(`accept_modal__${appealId}`)
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
  if (interaction.isButton() && interaction.customId.startsWith("reject__")) {
    const appealId = interaction.customId.slice("reject__".length);

    const modal = new ModalBuilder()
      .setCustomId(`reject_modal__${appealId}`)
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
    interaction.customId.startsWith("accept_modal__")
  ) {
    const appealId = interaction.customId.slice("accept_modal__".length);
    const reason = interaction.fields.getTextInputValue("accept_reason");
    const data = loadData();

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

    if (targetAppeal.status !== "pending") {
      return interaction.reply({
        content: `⚠️ Bu başvuru zaten **${targetAppeal.status}** durumunda!`,
        ephemeral: true,
      });
    }

    data.appeals[targetUserId][appealId].status = "accepted";
    data.appeals[targetUserId][appealId].reviewedBy = interaction.user.username;
    data.appeals[targetUserId][appealId].reviewReason = reason;
    data.appeals[targetUserId][appealId].reviewTimestamp = Date.now();

    // Ana sunucudan banı kaldır
    let banRemoved = false;
    try {
      const mainGuild = await client.guilds.fetch(CONFIG.MAIN_GUILD_ID);
      await mainGuild.bans.remove(targetUserId, `Ban affı kabul edildi. Sebep: ${reason}`);
      banRemoved = true;
    } catch (err) {
      console.error("Ban kaldırma hatası:", err.message);
    }

    // Kullanıcıya DM
    const dmResult = await sendDM(targetUserId, {
      embeds: [
        new EmbedBuilder()
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
          .setTimestamp(),
      ],
    });

    addLog(data, "APPEAL_ACCEPT", `${targetUserId} başvurusu kabul edildi. Yetkili: ${interaction.user.username}`);
    saveData(data);

    // Review mesajını güncelle
    try {
      await interaction.message.edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0x22c55e)
            .setTitle("📋 Ban Affı Başvurusu — ✅ KABUL EDİLDİ")
            .addFields({ name: "✅ Kabul Eden", value: interaction.user.username, inline: true }),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("done_accept")
              .setLabel("✅ Kabul Edildi")
              .setStyle(ButtonStyle.Success)
              .setDisabled(true)
          ),
        ],
      });
    } catch (err) {
      console.error("Mesaj güncellenemedi:", err.message);
    }

    const lines = [`✅ Ban affı kabul edildi!`];
    if (banRemoved) lines.push(`🔓 Sunucudan ban kaldırıldı.`);
    else lines.push(`⚠️ Ban kaldırılamadı (kullanıcı zaten unbanned olabilir).`);
    if (!dmResult.success) lines.push(`⚠️ Kullanıcıya DM gönderilemedi: ${dmResult.reason}`);
    else lines.push(`📨 Kullanıcıya bildirim DM'i gönderildi.`);

    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  }

  // ─── MODAL: Red Onayı ────────────────────────────────────
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("reject_modal__")
  ) {
    const appealId = interaction.customId.slice("reject_modal__".length);
    const reason = interaction.fields.getTextInputValue("reject_reason");
    const data = loadData();

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

    if (targetAppeal.status !== "pending") {
      return interaction.reply({
        content: `⚠️ Bu başvuru zaten **${targetAppeal.status}** durumunda!`,
        ephemeral: true,
      });
    }

    data.appeals[targetUserId][appealId].status = "rejected";
    data.appeals[targetUserId][appealId].reviewedBy = interaction.user.username;
    data.appeals[targetUserId][appealId].reviewReason = reason;
    data.appeals[targetUserId][appealId].reviewTimestamp = Date.now();

    const totalAppeals = Object.keys(data.appeals[targetUserId]).length;
    const remainingAppeals = CONFIG.MAX_APPEALS - totalAppeals;
    const isLastAppeal = remainingAppeals <= 0;

    // Kullanıcıya DM
    const dmResult = await sendDM(targetUserId, {
      embeds: [
        new EmbedBuilder()
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
                : `🔄 Tekrar ban affı başvurabilirsiniz.\n⚠️ **Uyarı:** Sadece **${remainingAppeals}** ban affı hakkınız kaldı!`,
            ].join("\n")
          )
          .setTimestamp(),
      ],
    });

    addLog(data, "APPEAL_REJECT", `${targetUserId} başvurusu reddedildi. Yetkili: ${interaction.user.username}`);
    saveData(data);

    // Review mesajını güncelle
    try {
      await interaction.message.edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0xef4444)
            .setTitle("📋 Ban Affı Başvurusu — ❌ REDDEDİLDİ")
            .addFields({ name: "❌ Reddeden", value: interaction.user.username, inline: true }),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("done_reject")
              .setLabel("❌ Reddedildi")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          ),
        ],
      });
    } catch (err) {
      console.error("Mesaj güncellenemedi:", err.message);
    }

    const lines = [`✅ Ban affı reddedildi!`];
    if (!dmResult.success) lines.push(`⚠️ Kullanıcıya DM gönderilemedi: ${dmResult.reason}`);
    else lines.push(`📨 Kullanıcıya bildirim DM'i gönderildi.`);

    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  }
});

// ============================================================
//  APPEAL KANAL MESAJI GÖNDER
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
          "⏳ Bekleyen başvurunuz varken tekrar başvuramazsınız.",
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

// ============================================================
//  HTTP SUNUCUSU (uptime için)
// ============================================================
const http = require("http");
http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot aktif!");
  })
  .listen(process.env.PORT || 3000);

// ============================================================
//  LOGIN
// ============================================================
client.login(process.env.BOT_TOKEN);
