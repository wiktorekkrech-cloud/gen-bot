import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fs from "fs";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// KOLORY
const COLOR_PUBLIC = 0xe53935; // 🔴 elegancki czerwony
const COLOR_DM = 0xffa726;     // 🟠 elegancki pomarańczowy

// LICZNIKI
let globalCount = 0;
let userCounts = {};

client.once("ready", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ================= !GEN =================
  if (message.content === "!gen") {
    const stockPath = "stock.txt";
    if (!fs.existsSync(stockPath)) {
      return message.reply("❌ Brak pliku stock.txt");
    }

    let lines = fs.readFileSync(stockPath, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // STOCK PUSTY
    if (lines.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0x000000)
        .setAuthor({ name: "Generator", iconURL: client.user.displayAvatarURL() })
        .setTitle("😭 Brak dostępnych kont")
        .setDescription(
          "Stock jest **pusty**.\n\n" +
          "🚨 **@chudy_33** – uzupełnij stock, bo ludzie płaczą."
        )
        .setFooter({ text: "Status: OFFLINE" })
        .setTimestamp();

      return message.channel.send({ embeds: [emptyEmbed] });
    }

    // LOSOWE KONTO
    const index = Math.floor(Math.random() * lines.length);
    const account = lines[index];

    // USUŃ ZE STOCKA
    lines.splice(index, 1);
    fs.writeFileSync(stockPath, lines.join("\n"));

    // LICZNIKI
    globalCount++;
    userCounts[message.author.id] = (userCounts[message.author.id] || 0) + 1;

    // ===== PUBLIC EMBED (CZERWONY, PREMIUM) =====
    const publicEmbed = new EmbedBuilder()
      .setColor(COLOR_PUBLIC)
      .setAuthor({
        name: "Account Generator",
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("🚨 Konto wygenerowane")
      .setDescription(
        "✨ **Sukces!** Twoje konto jest gotowe.\n\n" +
        "📩 **Sprawdź DM**, tam są dane.\n\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "🧠 **Jak używać:**\n" +
        "➡️ Wpisz `!gen`, aby wygenerować konto\n" +
        "➡️ Wpisz `!stock`, aby sprawdzić stan\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        `👤 Twoje generowania: **${userCounts[message.author.id]}**\n` +
        `🌍 Wszystkie generowania: **${globalCount}**`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Generator • bez duplikatów • stabilny" })
      .setTimestamp();

    await message.channel.send({ embeds: [publicEmbed] });

    // ===== DM EMBED (POMARAŃCZOWY, CLEAN) =====
    const dmEmbed = new EmbedBuilder()
      .setColor(COLOR_DM)
      .setAuthor({
        name: "Twoje konto",
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("🎁 Dane logowania")
      .setDescription(
        "🔐 **Login / Hasło:**\n" +
        "```" + account + "```"
      )
      .addFields(
        {
          name: "📌 Ważne",
          value: "To konto **zostało usunięte ze stocka** i nie pojawi się ponownie.",
          inline: false
        },
        {
          name: "🔁 Kolejne konto",
          value: "Wróć na serwer i użyj `!gen`",
          inline: false
        }
      )
      .setFooter({ text: "Miłego korzystania 👌" })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [dmEmbed] });
    } catch {
      await message.reply("❌ Masz zamknięte DM – nie mogę wysłać konta.");
    }
  }

  // ================= !STOCK =================
  if (message.content === "!stock") {
    const stockPath = "stock.txt";
    let stockCount = 0;

    if (fs.existsSync(stockPath)) {
      stockCount = fs.readFileSync(stockPath, "utf8")
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean).length;
    }

    const stockEmbed = new EmbedBuilder()
      .setColor(COLOR_PUBLIC)
      .setAuthor({
        name: "Generator – status",
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("📦 Stan stocka")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━\n" +
        `🟢 Dostępne konta: **${stockCount}**\n` +
        `👤 Twoje generowania: **${userCounts[message.author.id] || 0}**\n` +
        `🌍 Wszystkie generowania: **${globalCount}**\n` +
        "━━━━━━━━━━━━━━━━━━\n" +
        "➡️ Aby wygenerować konto, użyj `!gen`"
      )
      .setFooter({ text: "Generator • przejrzyście • bez spamu" })
      .setTimestamp();

    await message.channel.send({ embeds: [stockEmbed] });
  }
});

client.login(process.env.TOKEN);
