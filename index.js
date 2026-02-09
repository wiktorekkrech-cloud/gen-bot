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

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!gen fortnite") return;

  let lines = fs.readFileSync("stock.txt", "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return message.reply("💀 **Stock pusty. Nie ma kurwa cudów.**");
  }

  const randomIndex = Math.floor(Math.random() * lines.length);
  const account = lines[randomIndex];

  lines.splice(randomIndex, 1);
  fs.writeFileSync("stock.txt", lines.join("\n"));

  // EMBED NA KANALE
  const publicEmbed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("🎉 WYGENEROWANO KONTO 🎉")
    .setDescription(
      "✅ **Konto wygenerowane!**\n" +
      "📩 **Sprawdź prywatną wiadomość (DM)**\n\n" +
      "⚠️ *Nie udostępniaj nikomu tego konta, bo będzie płacz*"
    )
    .setFooter({ text: "💎 Free Generator | Lumyx " })
    .setTimestamp();

  await message.channel.send({ embeds: [publicEmbed] });

  // EMBED NA DM
  const dmEmbed = new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle("🎁 TWOJE KONTO 🎁")
    .setDescription(
      "🔐 **Dane logowania:**\n" +
      "```" + account + "```"
    )
    .addFields(
      { name: "⏰ Ważne", value: "Zapisz to sobie, bo drugi raz nie będzie.", inline: false },
      { name: "🧠 Rada", value: "Zmień hasło jak nie jesteś debilem.", inline: false }
    )
    .setFooter({ text: "😈 Miłego korzystania" })
    .setTimestamp();

  try {
    await message.author.send({ embeds: [dmEmbed] });
  } catch {
    await message.reply("❌ **Masz zamknięte DM, geniuszu.**");
  }
});

client.login(process.env.TOKEN);
