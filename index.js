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

// KOLORY (NIE ZMIENIONE)
const COLOR_RED = 0xe53935;
const COLOR_ORANGE = 0xff9800;
const COLOR_BLACK = 0x000000;

client.once("ready", () => {
  console.log("✅ Bot zapierdala");
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
            .setDescription("📦 **Stock jest pusty**\n\n🚨 Uzupełnij stock.")
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
        ]
      });
    }

    const index = Math.floor(Math.random() * stock.length);
    const account = stock.splice(index, 1)[0];
    fs.writeFileSync(STOCK_FILE, stock.join("\n"));

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
        "🧠 **JAK KORZYSTAĆ**\n" +
        "➡️ `!gen fortnite` — generuj konto\n" +
        "➡️ `!stock` — status stocka\n\n" +
        "⚠️ **ZASADY**\n" +
        "• Konto znika po użyciu\n" +
        "• Brak duplikatów\n" +
        "• Nie udostępniaj danych\n\n" +
        "━━━━━━━━━━━━━━━━━━"
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Generator • Fortnite" })
      .setTimestamp();

    await msg.channel.send({ embeds: [publicEmbed] });

    try {
      await msg.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ORANGE)
            .setTitle("🎁 TWOJE DANE LOGOWANIA")
            .setDescription("```" + account + "```")
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: "Miłego korzystania" })
            .setTimestamp()
        ]
      });
    } catch {
      msg.reply("❌ Masz zamknięte DM.");
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
              ? "🔴 **PUSTY** — brak kont"
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
            "Wybierz kategorię z listy.\n\n" +
            "📌 Ticket widzi tylko osoba, która go otworzy."
          )
      ],
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {

  // ===== TICKET MENU (NAPRAWIONE) =====
  if (i.isStringSelectMenu() && i.customId === "ticket-menu") {

    await i.deferReply({ ephemeral: true }); // KLUCZ – bez tego Discord się srał

    const type = i.values[0];
    const guild = i.guild;

    const channel = await guild.channels.create({
      name: `${type}-${i.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: i.channel.parent,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: i.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close-ticket")
        .setLabel("Zamknij ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: "@everyone",
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("📩 TICKET OTWARTY")
          .setDescription(
            `👤 Autor: ${i.user}\n` +
            `📌 Kategoria: **${type}**\n\n` +
            "Opisz dokładnie swój problem lub zamówienie."
          )
      ],
      components: [closeBtn]
    });

    await i.editReply({ content: "✅ Ticket utworzony" });
  }

  // ===== ZAMYKANIE =====
  if (i.isButton() && i.customId === "close-ticket") {
    await i.deferReply({ ephemeral: true });
    await i.channel.delete();
  }
});

client.login(process.env.TOKEN);
