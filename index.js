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

const COLOR_PUBLIC = 0x4da6ff; // jasny niebieski
const COLOR_DM = 0xffa500;     // pomarańczowy

let globalCount = 0;
let userCounts = {};

client.once("ready", () => {
  console.log(`✅ Bot działa jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ================= !GEN =================
  if (message.content === "!gen fortnite") {
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
        .setTitle("😭 Stock jest pusty")
        .setDescription("🚨 **@chudy_33 uzupełnij stock**\nGenerator chwilowo nieaktywny.")
        .setFooter({ text: "Status: brak dostępnych kont" })
        .setTimestamp();

      return message.channel.send({ embeds: [emptyEmbed] });
    }

    // LOSUJEMY KONTO
    const index = Math.floor(Math.random() * lines.length);
    const account = lines[index];

    // USUWAMY ZE STOCKA (NIE POWTÓRZY SIĘ)
    lines.splice(index, 1);
    fs.writeFileSync(stockPath, lines.join("\n"));

    // LICZNIKI
    globalCount++;
    userCounts[message.author.id] = (userCounts[message.author.id] || 0) + 1;

    // ===== PUBLIC EMBED =====
    const publicEmbed = new EmbedBuilder()
      .setColor(COLOR_PUBLIC)
      .setTitle("✅ Konto wygenerowane pomyślnie")
      .setDescription(
        "📩 **Sprawdź wiadomości prywatne (DM)**\n\n" +
        "ℹ️ **Jak używać generatora:**\n" +
        "➡️ Wpisz `!gen`, aby wygenerować konto\n\n" +
        `👤 Twoje wygenerowania: **${userCounts[message.author.id]}**\n` +
        `🌍 Wszystkie wygenerowania: **${globalCount}**`
      )
      .setFooter({ text: "Generator • stabilny • bez duplikatów" })
      .setTimestamp();

    await message.channel.send({ embeds: [publicEmbed] });

    // ===== DM EMBED =====
    const dmEmbed = new EmbedBuilder()
      .setColor(COLOR_DM)
      .setTitle("🎁 Twoje wygenerowane konto")
      .setDescription(
        "🔐 **Dane logowania:**\n" +
        "```" + account + "```"
      )
      .addFields(
        { name: "📌 Ważne", value: "To konto **nie pojawi się ponownie**. Zapisz je.", inline: false },
        { name: "🔁 Kolejne konto", value: "Wróć na serwer i użyj `!gen fortnite`", inline: false }
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
      .setTitle("📦 Status generatora")
      .setDescription(
        `🟢 Kont dostępnych: **${stockCount}**\n` +
        `👤 Twoje wygenerowania: **${userCounts[message.author.id] || 0}**\n` +
        `🌍 Wszystkie wygenerowania: **${globalCount}**\n\n` +
        "➡️ Aby wygenerować konto, użyj `!gen`"
      )
      .setFooter({ text: "Generator – Darmowe konta fortnite" })
      .setTimestamp();

    await message.channel.send({ embeds: [stockEmbed] });
  }
});

client.login(process.env.TOKEN);
