import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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

const COLOR_RED = 0xe53935;
const COLOR_ORANGE = 0xffa726;
const COLOR_BLACK = 0x000000;

const STOCK_FILE = "stock.txt";
const DATA_FILE = "data.json";

// ===== WCZYTAJ DANE =====
let data = { globalCount: 0, userCounts: {} };
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.once("ready", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

// ================== MESSAGE ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ===== !GEN =====
  if (message.content === "!gen fortnite") {
    if (!fs.existsSync(STOCK_FILE)) {
      return message.reply("❌ Brak stock.txt");
    }

    let stock = fs.readFileSync(STOCK_FILE, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (stock.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(COLOR_BLACK)
        .setTitle("😭 Stock pusty")
        .setDescription("📦 Brak kont\n\n🚨 @chudy_33 uzupełnij stock")
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    const index = Math.floor(Math.random() * stock.length);
    const account = stock[index];

    stock.splice(index, 1);
    fs.writeFileSync(STOCK_FILE, stock.join("\n"));

    data.globalCount++;
    data.userCounts[message.author.id] =
      (data.userCounts[message.author.id] || 0) + 1;
    saveData();

    const publicEmbed = new EmbedBuilder()
      .setColor(COLOR_RED)
      .setTitle("🚨 Konto wygenerowane")
      .setDescription(
        "📩 **Sprawdź DM**\n\n" +
        "🧠 Komenda: `!gen`\n\n" +
        `👤 Twoje generowania: **${data.userCounts[message.author.id]}**\n` +
        `🌍 Wszystkie: **${data.globalCount}**`
      )
      .setTimestamp();

    await message.channel.send({ embeds: [publicEmbed] });

    const dmEmbed = new EmbedBuilder()
      .setColor(COLOR_ORANGE)
      .setTitle("🎁 Dane konta")
      .setDescription("```" + account + "```")
      .setFooter({ text: "Konto usunięte ze stocka" })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [dmEmbed] });
    } catch {
      message.reply("❌ Masz zamknięte DM");
    }
  }

  // ===== !STOCK =====
  if (message.content === "!stock") {
    let count = 0;
    if (fs.existsSync(STOCK_FILE)) {
      count = fs.readFileSync(STOCK_FILE, "utf8")
        .split("\n").filter(Boolean).length;
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR_RED)
      .setTitle("📦 Stock")
      .setDescription(
        `🟢 Dostępne: **${count}**\n` +
        `👤 Twoje: **${data.userCounts[message.author.id] || 0}**\n` +
        `🌍 Globalnie: **${data.globalCount}**`
      );

    message.channel.send({ embeds: [embed] });
  }

  // ===== +REP =====
  if (message.content.startsWith("+rep")) {
    const args = message.content.split(" ").slice(1);
    const user = message.mentions.users.first();
    if (!user || args.length < 3) return;

    const product = args[1];
    const price = args.slice(2).join(" ");

    const repEmbed = new EmbedBuilder()
      .setColor(COLOR_BLACK)
      .setTitle("⭐ Opinia / Legit Check")
      .setDescription(
        `👤 Sprzedawca: ${user}\n` +
        `📦 Produkt: **${product}**\n` +
        `💰 Cena: **${price}**\n\n` +
        "✍️ Opinia zostawiona przez klienta"
      )
      .setTimestamp();

    const msg = await message.channel.send({ embeds: [repEmbed] });
    await msg.pin();
  }

  // ===== !TICKET =====
  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setColor(COLOR_BLACK)
      .setTitle("🎫 Ticket Panel")
      .setDescription("Wybierz powód z listy poniżej");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket-select")
      .setPlaceholder("Wybierz opcję")
      .addOptions([
        { label: "Zakup konta", value: "zakup" },
        { label: "Pomoc", value: "pomoc" }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================== INTERACTION ==================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket-select") return;

  const type = interaction.values[0];
  const guild = interaction.guild;
  const category = interaction.channel.parent;
  const name =
    (type === "zakup" ? "zakup-konta-" : "pomoc-") +
    interaction.user.username.toLowerCase();

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setColor(COLOR_BLACK)
    .setTitle("📩 Ticket otwarty")
    .setDescription(
      `👤 Użytkownik: ${interaction.user}\n` +
      `📌 Typ: **${type}**`
    )
    .setTimestamp();

  channel.send({
    content: "@everyone",
    embeds: [embed]
  });

  interaction.reply({ content: "✅ Ticket utworzony", ephemeral: true });
});

client.login(process.env.TOKEN);
