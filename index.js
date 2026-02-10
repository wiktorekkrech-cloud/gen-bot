import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} from "discord.js";
import fs from "fs";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const STOCK_FILE = "stock.txt";

// KOLORY
const COLOR_RED = 0xe53935;
const COLOR_ORANGE = 0xff9800;
const COLOR_BLACK = 0x000000;

// ROLE
const SUPPORT_ROLE_ID = "ID_SUPPORTU";
const ADMIN_ROLE_ID = "ID_ADMINA";

client.once("ready", () => {
  console.log("✅ Bot zapierdala jak złoto");
});

// ================= MESSAGE =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // ===== !GEN =====
  if (msg.content === "!gen fortnite") {
    if (!fs.existsSync(STOCK_FILE)) return;

    let stock = fs.readFileSync(STOCK_FILE, "utf8")
      .split("\n").map(x => x.trim()).filter(Boolean);

    if (stock.length === 0) {
      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("😭 Brak dostępnych kont")
            .setDescription("📦 **Stock jest pusty**\n\n🚨 Chudy uzupełnij stock, bo ludzie czekają.")
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
        ]
      });
    }

    // LOSUJ I USUŃ
    const index = Math.floor(Math.random() * stock.length);
    const account = stock.splice(index, 1)[0];
    fs.writeFileSync(STOCK_FILE, stock.join("\n"));

    // ===== PUBLIC EMBED (DŁUGI, PREMIUM) =====
    const publicEmbed = new EmbedBuilder()
      .setColor(COLOR_RED)
      .setAuthor({
        name: "Account Generator",
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("🚨 GENERATOR – SUKCES")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━\n" +
        "🎉 **KONTO ZOSTAŁO WYGENEROWANE**\n\n" +
        "📩 Dane logowania zostały **wysłane na DM**.\n" +
        "Jeśli nie widzisz wiadomości — **otwórz DM**.\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "🧠 **JAK KORZYSTAĆ Z GENERATORA**\n" +
        "➡️ `!gen fortnite` — wygeneruj konto\n" +
        "➡️ `!stock` — sprawdź dostępność\n\n" +
        "⚠️ **ZASADY**\n" +
        "• Konto znika po użyciu\n" +
        "• Brak duplikatów\n" +
        "• Nie udostępniaj danych\n\n" +
        "💎 Generator działa stabilnie i bez powtórek\n" +
        "━━━━━━━━━━━━━━━━━━"
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Generator • premium • bez spamu" })
      .setTimestamp();

    await msg.channel.send({ embeds: [publicEmbed] });

    // ===== DM EMBED =====
    try {
      await msg.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ORANGE)
            .setTitle("🎁 TWOJE DANE LOGOWANIA")
            .setDescription(
              "🔐 **Login / Hasło:**\n" +
              "```" + account + "```"
            )
            .addFields(
              { name: "📌 Ważne", value: "To konto **nie wróci** do stocka.", inline: false },
              { name: "🔁 Następne", value: "Wróć na serwer i użyj `!gen`", inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: "Miłego korzystania 👌" })
            .setTimestamp()
        ]
      });
    } catch {
      msg.reply("❌ Masz zamknięte DM – nie mogę wysłać danych.");
    }
  }

  // ===== !STOCK =====
  if (msg.content === "!stock") {
    const count = fs.existsSync(STOCK_FILE)
      ? fs.readFileSync(STOCK_FILE, "utf8").split("\n").filter(Boolean).length
      : 0;

    msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RED)
          .setTitle("📦 STATUS STOCKA")
          .setDescription(
            count === 0
              ? "🔴 **PUSTY** — brak dostępnych kont"
              : `🟢 Dostępne konta: **${count}**`
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setTimestamp()
      ]
    });
  }

  // ===== !TICKET =====
  if (msg.content === "!ticket") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket-menu")
      .setPlaceholder("Wybierz kategorię")
      .addOptions([
        { label: "🛒 Zakup konta", value: "zakup" },
        { label: "🆘 Pomoc", value: "pomoc" }
      ]);

    msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("🎫 PANEL TICKETÓW")
          .setDescription(
            "Wybierz kategorię z listy poniżej.\n\n" +
            "📌 Tickety widzą tylko:\n" +
            "• Ty\n• Support\n• Admin"
          )
      ],
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {
  if (i.isStringSelectMenu() && i.customId === "ticket-menu") {
    const type = i.values[0];
    const guild = i.guild;

    const channel = await guild.channels.create({
      name: `${type}-${i.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: i.channel.parent,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: SUPPORT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel] },
        { id: ADMIN_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel] }
      ]
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close-ticket")
        .setLabel("Zamknij ticket")
        .setStyle(ButtonStyle.Danger)
    );

    channel.send({
      content: "@everyone",
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("📩 TICKET OTWARTY")
          .setDescription(`👤 ${i.user}\n📌 Typ: **${type}**`)
      ],
      components: [closeBtn]
    });

    i.reply({ content: "✅ Ticket utworzony", ephemeral: true });
  }

  if (i.isButton() && i.customId === "close-ticket") {
    if (
      !i.member.roles.cache.has(ADMIN_ROLE_ID) &&
      !i.member.roles.cache.has(SUPPORT_ROLE_ID)
    ) {
      return i.reply({ content: "❌ Brak uprawnień", ephemeral: true });
    }
    await i.channel.delete();
  }
});

client.login(process.env.TOKEN);
