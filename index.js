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

client.once("ready", () => {
  console.log(`🔥 Bot odpalony jako ${client.user.tag}`);
});

// Kolory tęczy
const rainbowColors = [
  0xFF0000, // czerwony
  0xFF7F00, // pomarańcz
  0xFFFF00, // żółty
  0x00FF00, // zielony
  0x0000FF, // niebieski
  0x4B0082, // indygo
  0x8B00FF  // fiolet
];

// Globalny licznik
let globalCount = 0;
// Licznik per użytkownik
let userCounts = {};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // LOSOWANIE KONTA
  if (message.content === "!gen") {
    const stockPath = "stock.txt";
    if (!fs.existsSync(stockPath)) return message.reply("💀 Stock nie istnieje.");

    let lines = fs.readFileSync(stockPath, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // STOCK PUSTY
    if (lines.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("😭 Stock jest pusty!")
        .setDescription("💀 @chudy_33, uzupełnij go kurwa!")
        .setFooter({ text: "Generator nie działa dopóki stock nie wróci" })
        .setTimestamp();

      return message.channel.send({ embeds: [emptyEmbed] });
    }

    // Losowe konto
    const randomIndex = Math.floor(Math.random() * lines.length);
    const account = lines[randomIndex];

    // Usuwamy konto ze stocka
    lines.splice(randomIndex, 1);
    fs.writeFileSync(stockPath, lines.join("\n"));

    // Aktualizacja liczników
    globalCount++;
    if (!userCounts[message.author.id]) userCounts[message.author.id] = 0;
    userCounts[message.author.id]++;

    // Losowy kolor z tęczy
    const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];

    // EMBED NA KANALE
    const publicEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🎉 Konto wygenerowane 🎉")
      .setDescription(
        `📩 Sprawdź DM\n` +
        `👤 Twoje wygenerowane konta: **${userCounts[message.author.id]}**\n` +
        `🌐 Wszystkich wygenerowanych kont: **${globalCount}**`
      )
      .setFooter({ text: "💎 Free Generator | Zajebista robota" })
      .setTimestamp();

    await message.channel.send({ embeds: [publicEmbed] });

    // EMBED NA DM
    const dmEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🎁 TWOJE KONTO 🎁")
      .setDescription("🔐 **Dane logowania:**\n```" + account + "```")
      .addFields(
        { name: "⏰ Ważne", value: "Zapisz to sobie, bo drugi raz nie będzie.", inline: false },
        { name: "🧠 Rada", value: "Zmień hasło, bo inaczej płacz.", inline: false }
      )
      .setFooter({ text: "😈 Miłego korzystania" })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [dmEmbed] });
    } catch {
      await message.reply("❌ Masz zamknięte DM, geniuszu.");
    }
  }

  // KOMENDA !STOCK
  if (message.content === "!stock") {
    const stockPath = "stock.txt";
    let stockCount = 0;
    if (fs.existsSync(stockPath)) {
      let lines = fs.readFileSync(stockPath, "utf8")
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);
      stockCount = lines.length;
    }

    const color = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("📦 Status Stocka")
      .setDescription(
        `🟢 Kont w stocku: **${stockCount}**\n` +
        `👤 Twoje wygenerowane konta: **${userCounts[message.author.id] || 0}**\n` +
        `🌐 Wszystkich wygenerowanych kont: **${globalCount}**`
      )
      .setFooter({ text: "💎 Free Generator | Zajebista robota" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
