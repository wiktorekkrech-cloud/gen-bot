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

const PREFIX = "!gen";

function getRandomStock() {
  const data = fs.readFileSync("stock.txt", "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)];
}

client.on("ready", () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (msg.content !== PREFIX) return;

  const pick = getRandomStock();
  if (!pick) {
    return msg.reply("❌ Stock pusty, kurwa.");
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle("✅ Wygenerowano")
    .setDescription("Twoje dane zostały wygenerowane!\n📩 **Sprawdź DM**")
    .setFooter({ text: "Generator" });

  await msg.channel.send({ embeds: [embed] });

  try {
    await msg.author.send(
      `🔐 **Twoje dane:**\n\`\`\`\n${pick}\n\`\`\``
    );
  } catch {
    msg.reply("❌ Masz zamknięte DM, debilu.");
  }
});

client.login(process.env.TOKEN);
