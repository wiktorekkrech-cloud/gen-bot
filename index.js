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

// ===== KONFIG =====
const COLOR_RED = 0xe53935;
const COLOR_ORANGE = 0xffa726;
const COLOR_BLACK = 0x000000;

const STOCK_FILE = "stock.txt";
const DATA_FILE = "data.json";

const SUPPORT_ROLE_ID = "ID_ROLI_SUPPORTU";
const ADMIN_ROLE_ID = "ID_ROLI_ADMINA";

// ===== DANE =====
let data = { globalCount: 0, userCounts: {} };
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
const saveData = () =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ===== READY =====
client.once("ready", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

// ================== MESSAGE ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===== GENERATOR =====
  if (message.content === "!gen fortnite") {
    if (!fs.existsSync(STOCK_FILE)) return;

    let stock = fs.readFileSync(STOCK_FILE, "utf8")
      .split("\n").map(x => x.trim()).filter(Boolean);

    if (stock.length === 0) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("😭 Brak kont")
            .setDescription("🚨 @chudy_33 uzupełnij stock")
            .setTimestamp()
        ]
      });
    }

    const index = Math.floor(Math.random() * stock.length);
    const account = stock[index];
    stock.splice(index, 1);
    fs.writeFileSync(STOCK_FILE, stock.join("\n"));

    data.globalCount++;
    data.userCounts[message.author.id] =
      (data.userCounts[message.author.id] || 0) + 1;
    saveData();

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RED)
          .setTitle("🚨 Konto wygenerowane")
          .setDescription(
            "📩 **Sprawdź DM**\n\n" +
            "➡️ `!gen fortnite` – generuj konto\n" +
            "➡️ `!stock` – sprawdź stock\n\n" +
            `👤 Twoje: **${data.userCounts[message.author.id]}**\n` +
            `🌍 Globalnie: **${data.globalCount}**`
          )
          .setTimestamp()
      ]
    });

    try {
      await message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ORANGE)
            .setTitle("🎁 Dane konta")
            .setDescription("```" + account + "```")
            .setFooter({ text: "Konto usunięte ze stocka" })
        ]
      });
    } catch {}
  }

  // ===== STOCK =====
  if (message.content === "!stock") {
    let count = fs.existsSync(STOCK_FILE)
      ? fs.readFileSync(STOCK_FILE, "utf8").split("\n").filter(Boolean).length
      : 0;

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RED)
          .setTitle("📦 Stock")
          .setDescription(
            `🟢 Dostępne: **${count}**\n` +
            `👤 Twoje: **${data.userCounts[message.author.id] || 0}**\n` +
            `🌍 Globalnie: **${data.globalCount}**`
          )
      ]
    });
  }

  // ===== +REP (WZÓR) =====
  if (message.content.startsWith("+rep")) {
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLACK)
      .setTitle("⭐ WZÓR OPINII")
      .setDescription(
        "**Użyj dokładnie tego wzoru:**\n\n" +
        "`+rep @użytkownik | produkt | cena`\n\n" +
        "📌 Opinie inne niż ten wzór będą usuwane."
      );

    await message.channel.send({ embeds: [embed] });
  }

  // ===== TICKET PANEL =====
  if (message.content === "!ticket") {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket-menu")
      .setPlaceholder("Wybierz kategorię")
      .addOptions([
        { label: "Zakup konta", value: "zakup" },
        { label: "Pomoc", value: "pomoc" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("🎫 Ticket Panel")
          .setDescription("Wybierz kategorię z listy poniżej")
      ],
      components: [row]
    });
  }
});

// ================== INTERACTIONS ==================
client.on("interactionCreate", async (i) => {
  if (i.isStringSelectMenu() && i.customId === "ticket-menu") {
    const type = i.values[0];
    const guild = i.guild;
    const category = i.channel.parent;

    const channel = await guild.channels.create({
      name: `${type}-${i.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: category,
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
          .setTitle("📩 Ticket otwarty")
          .setDescription(
            `👤 ${i.user}\n📌 Typ: **${type}**`
          )
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
