const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const PREFIX = "!";

client.once("ready", () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const cmd = message.content.slice(PREFIX.length).toLowerCase();

  if (cmd === "gen") {
    const stockPath = "./stock/gen.txt";

    if (!fs.existsSync(stockPath)) {
      return message.reply("❌ **Brak stocka, kurwa.**");
    }

    let lines = fs.readFileSync(stockPath, "utf8")
      .split("\n")
      .filter(l => l.trim() !== "");

    if (lines.length === 0) {
      return message.reply("❌ **Stock pusty jak Twoja lodówka.**");
    }

    // LOSOWA LINIJKA
    const randomIndex = Math.floor(Math.random() * lines.length);
    const account = lines[randomIndex];

    // USUŃ WYLOSOWANE KONTO ZE STOCKA
    lines.splice(randomIndex, 1);
    fs.writeFileSync(stockPath, lines.join("\n"));

    // EMBED NA KANALE
    const publicEmbed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle("✅ Konto wygenerowane")
      .setDescription("📩 **Sprawdź prywatną wiadomość (DM)**")
      .setFooter({ text: "Generator działa jak złoto 🥵" })
      .setTimestamp();

    await message.channel.send({ embeds: [publicEmbed] });

    // EMBED NA DM
    const dmEmbed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🎁 Twoje wygenerowane konto")
      .setDescription("```" + account + "```")
      .setFooter({ text: "Nie zgub tego, bo drugiego nie będzie" })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [dmEmbed] });
    } catch {
      message.reply("❌ **Masz zamknięte DM-y, debilu.**");
    }
  }
});

client.login(process.env.TOKEN);
