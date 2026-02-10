import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
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

// ===== PLIKI =====
const STOCK_FILE = "stock.txt";
const PREMIUM_STOCK_FILE = "premiumstock.txt";

// ===== KANAŁY =====
const GEN_CHANNEL_ID = "1470504663915958466";
const PREMIUM_GEN_CHANNEL_ID = "1470824560646684885";

// ===== KOLORY =====
const COLOR_RED = 0xe53935;
const COLOR_ORANGE = 0xff9800;
const COLOR_BLACK = 0x000000;
const COLOR_PREMIUM = 0x42a5f5;

// ===== STAN =====
let generatorEnabled = true;

client.once("ready", () => {
  console.log("✅ Bot działa");
});

// ================= MESSAGE =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // ===== !OPINIA =====
  if (msg.content === "!opinia") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open-opinion")
        .setLabel("📝 Wystaw opinię")
        .setStyle(ButtonStyle.Primary)
    );

    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_PREMIUM)
          .setTitle("⭐ Opinie o sklepie")
          .setDescription(
            "Kliknij przycisk poniżej, aby wystawić **opinię o naszym sklepie**.\n\n" +
            "🧑 Obsługa klienta\n⏱ Czas realizacji\n💎 Jakość produktu"
          )
      ],
      components: [row]
    });
  }

  // ===== !OFF =====
  if (msg.content === "!off") {
    generatorEnabled = false;
    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("⛔ Generator wyłączony")
          .setDescription("Generator został **tymczasowo wyłączony**.")
      ]
    });
  }

  // ===== !ON =====
  if (msg.content === "!on") {
    generatorEnabled = true;
    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("✅ Generator włączony")
          .setDescription("Generator został **ponownie uruchomiony**.")
      ]
    });
  }

  // ===== WYŁĄCZONY =====
  if (!generatorEnabled && msg.content.startsWith("!gen")) {
    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("⏳ Generator niedostępny")
          .setDescription("Generator jest obecnie **wyłączony**.")
      ]
    });
  }

  // ===== !GEN NORMAL =====
  if (msg.content === "!gen fortnite") {
    if (msg.channel.id !== GEN_CHANNEL_ID) {
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("❌ Zły kanał")
            .setDescription("Użyj tej komendy **na kanale generatora**.")
        ]
      });
    }

    let stock = fs.existsSync(STOCK_FILE)
      ? fs.readFileSync(STOCK_FILE, "utf8").split("\n").filter(Boolean)
      : [];

    if (stock.length === 0) {
      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("😭 Stock pusty")
            .setDescription("Brak dostępnych kont.")
            .setThumbnail(client.user.displayAvatarURL())
        ]
      });
    }

    const acc = stock.splice(Math.floor(Math.random() * stock.length), 1)[0];
    fs.writeFileSync(STOCK_FILE, stock.join("\n"));

    await msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RED)
          .setAuthor({ name: "Account Generator", iconURL: client.user.displayAvatarURL() })
          .setTitle("🚨 GENERATOR – SUKCES")
          .setDescription("📩 Dane wysłano na **DM**.")
          .setThumbnail(client.user.displayAvatarURL())
      ]
    });

    try {
      await msg.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_ORANGE)
            .setTitle("🎁 TWOJE KONTO")
            .setDescription("```" + acc + "```")
        ]
      });
    } catch {}
  }

  // ===== !GEN PREMIUM =====
  if (msg.content === "!gen premium") {
    if (msg.channel.id !== PREMIUM_GEN_CHANNEL_ID) {
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("❌ Zły kanał")
            .setDescription("Użyj tej komendy **na kanale premium 💎**.")
        ]
      });
    }

    let stock = fs.existsSync(PREMIUM_STOCK_FILE)
      ? fs.readFileSync(PREMIUM_STOCK_FILE, "utf8").split("\n").filter(Boolean)
      : [];

    if (stock.length === 0) {
      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_BLACK)
            .setTitle("💎 Premium stock pusty")
            .setDescription("Brak kont premium.")
        ]
      });
    }

    const acc = stock.splice(Math.floor(Math.random() * stock.length), 1)[0];
    fs.writeFileSync(PREMIUM_STOCK_FILE, stock.join("\n"));

    await msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_PREMIUM)
          .setTitle("💎 PREMIUM – SUKCES")
          .setDescription("📩 Sprawdź **DM**.")
      ]
    });

    try {
      await msg.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_PREMIUM)
            .setTitle("💎 TWOJE KONTO PREMIUM")
            .setDescription("```" + acc + "```")
        ]
      });
    } catch {}
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (i) => {

  // ===== OTWARCIE FORMULARZA =====
  if (i.isButton() && i.customId === "open-opinion") {
    const modal = new ModalBuilder()
      .setCustomId("opinion-modal")
      .setTitle("📝 Opinia o sklepie");

    const service = new TextInputBuilder()
      .setCustomId("service")
      .setLabel("Obsługa klienta (1-5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const time = new TextInputBuilder()
      .setCustomId("time")
      .setLabel("Czas realizacji (1-5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const quality = new TextInputBuilder()
      .setCustomId("quality")
      .setLabel("Jakość produktu (1-5)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const text = new TextInputBuilder()
      .setCustomId("text")
      .setLabel("Twoja opinia")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(service),
      new ActionRowBuilder().addComponents(time),
      new ActionRowBuilder().addComponents(quality),
      new ActionRowBuilder().addComponents(text)
    );

    await i.showModal(modal);
  }

  // ===== WYSŁANIE OPINII =====
  if (i.isModalSubmit() && i.customId === "opinion-modal") {
    const s = i.fields.getTextInputValue("service");
    const t = i.fields.getTextInputValue("time");
    const q = i.fields.getTextInputValue("quality");
    const txt = i.fields.getTextInputValue("text");

    const stars = (n) => "⭐".repeat(n);

    await i.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_PREMIUM)
          .setTitle("🛒 Nowa opinia")
          .setDescription(
            `👤 **Autor:** ${i.user}\n\n` +
            `🧑 Obsługa klienta: ${stars(s)} (${s}/5)\n` +
            `⏱ Czas realizacji: ${stars(t)} (${t}/5)\n` +
            `💎 Jakość produktu: ${stars(q)} (${q}/5)\n\n` +
            `📝 **Opinia:**\n> ${txt}`
          )
          .setThumbnail(i.user.displayAvatarURL())
      ]
    });

    await i.reply({ content: "✅ Opinia została dodana!", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
