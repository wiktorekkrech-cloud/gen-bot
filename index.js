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
  TextInputStyle,
  SlashCommandBuilder,
  REST,
  Routes
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

// ===== SLASHES =====
const commands = [
  new SlashCommandBuilder()
    .setName("opinia")
    .setDescription("Wystaw opinię o sklepie"),
  new SlashCommandBuilder()
    .setName("drop")
    .setDescription("Tworzy drop z nagrodą"),
  new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Wysyła instrukcje do repa na tickecie"),
  new SlashCommandBuilder()
    .setName("exchange")
    .setDescription("Dokonaj wymiany kontem")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log("✅ Bot działa");

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
  console.log("✅ Komendy /opinia, /drop, /rep i /exchange zarejestrowane");
});

// ================= MESSAGE =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // ===== !STOCK =====
  if (msg.content === "!stock") {
    const normal = fs.existsSync(STOCK_FILE)
      ? fs.readFileSync(STOCK_FILE, "utf8").split("\n").filter(Boolean).length
      : 0;

    const premium = fs.existsSync(PREMIUM_STOCK_FILE)
      ? fs.readFileSync(PREMIUM_STOCK_FILE, "utf8").split("\n").filter(Boolean).length
      : 0;

    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_RED)
          .setTitle("📦 STATUS STOCKA")
          .setDescription(
            `🔴 **Normalny:** ${normal > 0 ? `🟢 ${normal} kont` : "🔴 brak"}\n` +
            `💎 **Premium:** ${premium > 0 ? `🟢 ${premium} kont` : "🔴 brak"}`
          )
          .setThumbnail(client.user.displayAvatarURL())
      ]
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
          .setDescription(
            "━━━━━━━━━━━━━━━━━━\n" +
            "Generator został **tymczasowo wyłączony**.\n" +
            "Spróbuj ponownie później.\n" +
            "━━━━━━━━━━━━━━━━━━"
          )
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
          .setDescription(
            "━━━━━━━━━━━━━━━━━━\n" +
            "Generator został **ponownie uruchomiony**.\n" +
            "Możesz znowu generować konta.\n" +
            "━━━━━━━━━━━━━━━━━━"
          )
      ]
    });
  }

  // ===== !TICKET =====
  if (msg.content === "!ticket") {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket-menu")
        .setPlaceholder("📩 Wybierz typ ticketa")
        .addOptions([
          { label: "Zakup konta", value: "zakup" },
          { label: "Pomoc", value: "pomoc" }
        ])
    );

    return msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_BLACK)
          .setTitle("🎫 System ticketów")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━\n" +
            "Wybierz powód otwarcia ticketa.\n\n" +
            "🛒 Zakup konta\n" +
            "🆘 Pomoc techniczna\n" +
            "━━━━━━━━━━━━━━━━━━"
          )
      ],
      components: [menu]
    });
  }

  // ===== !CZYLEGIT =====
  if (msg.content === "!czylegit") {
    const embed = new EmbedBuilder()
      .setColor(COLOR_PREMIUM)
      .setTitle("**Lumyx Stock × Czy Legit?**")
      .setDescription(
        "» Jeśli uważasz że Lumyx Stock jest legit zaznacz reakcję ✅\n" +
        "» Jeśli uważasz, że nie jesteśmy legit zaznacz ❌\n\n" +
        "```Zaznaczenie reakcji ❌ bezpodstawnie skutkuje **banem na okres 7 dni**```"
      )
      .setFooter({ text: "Wyraź swoją opinię" })
      .setTimestamp();

    const sentMessage = await msg.channel.send({ embeds: [embed] });
    await sentMessage.react("✅");
    await sentMessage.react("❌");
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
  if (msg.content === "!gen") {
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
          .setDescription(
            "━━━━━━━━━━━━━━━━━━\n" +
            "🎉 **KONTO ZOSTAŁO WYGENEROWANE**\n\n" +
            "📩 Dane wysłano w **wiadomości prywatnej**.\n\n" +
            "ℹ️ Komendy:\n" +
            "• `!gen`\n" +
            "• `!stock`\n\n" +
            "⚠️ Nie udostępniaj danych.\n" +
            "━━━━━━━━━━━━━━━━━━"
          )
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
          .setAuthor({ name: "💎 Premium Generator", iconURL: client.user.displayAvatarURL() })
          .setTitle("💎 PREMIUM – SUKCES")
          .setDescription(
            "━━━━━━━━━━━━━━━━━━\n" +
            "✨ **KONTO PREMIUM WYGENEROWANE**\n\n" +
            "📩 Sprawdź **DM**.\n" +
            "💎 Jakość • Stabilność • Premium\n" +
            "━━━━━━━━━━━━━━━━━━"
          )
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

  // ===== TICKET MENU =====
  if (i.isStringSelectMenu() && i.customId === "ticket-menu") {
    const type = i.values[0];

    const channel = await i.guild.channels.create({
      name: `${type}-${i.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: i.channel.parent,
      permissionOverwrites: [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
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
          .setTitle("📩 Ticket otwarty")
          .setDescription(
            `👤 Autor: ${i.user}\n` +
            `📌 Typ: **${type}**\n\n` +
            "Opisz dokładnie swój problem."
          )
      ],
      components: [closeBtn]
    });

    await i.reply({ content: "✅ Ticket utworzony", ephemeral: true });
  }

  if (i.isButton() && i.customId === "close-ticket") {
    await i.channel.delete();
  }

  // ===== OPINIA =====
  if (i.isChatInputCommand() && i.commandName === "opinia") {
    const modal = new ModalBuilder()
      .setCustomId("opinia-modal")
      .setTitle("📝 Opinia o sklepie");

    const f = (id, label) =>
      new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label + " (1–5)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(f("service", "Obsługa klienta")),
      new ActionRowBuilder().addComponents(f("time", "Czas realizacji")),
      new ActionRowBuilder().addComponents(f("quality", "Jakość produktu")),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("text")
          .setLabel("Treść opinii")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await i.showModal(modal);
  }

  if (i.isModalSubmit() && i.customId === "opinia-modal") {
    const stars = n => "⭐".repeat(Math.min(5, Math.max(1, Number(n))));

    await i.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_PREMIUM)
          .setTitle("🛒 Nowa opinia")
          .setDescription(
            `👤 ${i.user}\n\n` +
            `🧑 Obsługa: ${stars(i.fields.getTextInputValue("service"))}\n` +
            `⏱ Czas: ${stars(i.fields.getTextInputValue("time"))}\n` +
            `💎 Jakość: ${stars(i.fields.getTextInputValue("quality"))}\n\n` +
            `📝 **Opinia:**\n> ${i.fields.getTextInputValue("text")}`
          )
      ]
    });

    await i.reply({ content: "✅ Opinia dodana", ephemeral: true });
  }

  // ===== DROP =====
  if (i.isChatInputCommand() && i.commandName === "drop") {
    const modal = new ModalBuilder()
      .setCustomId("drop-modal")
      .setTitle("🎁 Utwórz drop");

    const rewardInput = new TextInputBuilder()
      .setCustomId("reward")
      .setLabel("Co jest nagrodą?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const messageInput = new TextInputBuilder()
      .setCustomId("message")
      .setLabel("Treść wiadomości (np. kto pierwszy napisze...)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(rewardInput),
      new ActionRowBuilder().addComponents(messageInput)
    );

    await i.showModal(modal);
  }

  if (i.isModalSubmit() && i.customId === "drop-modal") {
    const reward = i.fields.getTextInputValue("reward");
    const message = i.fields.getTextInputValue("message");

    await i.deferReply({ ephemeral: true });

    await i.channel.send({
      content: "@everyone",
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR_ORANGE)
          .setTitle("🎁 NOWY DROP!")
          .setDescription(
            `${message}\n\n` +
            `🏆 Nagroda: **${reward}**\n` +
            `👤 Ping zwycięzcy: ${i.user}`
          )
          .setTimestamp()
      ]
    });

    await i.editReply({ content: "✅ Drop utworzony" });
  }

  // ===== REP =====
  if (i.isChatInputCommand() && i.commandName === "rep") {
    // Sprawdzamy ticket niezależnie od dodatkowych znaków
    if (!i.channel.name.toLowerCase().startsWith("zakup")) {
      return i.reply({ content: "❌ Komenda /rep działa tylko na kanale ticketu zakupu", ephemeral: true });
    }

    // Pobieramy autora ticketu z permission
    const ticketAuthor = i.channel.members.filter(m => m.permissions.has(PermissionsBitField.Flags.ViewChannel) && !m.user.bot).first();

    if (!ticketAuthor) return i.reply({ content: "❌ Nie znaleziono autora ticketu", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(COLOR_PREMIUM)
      .setTitle("Lumyx Stock × Legit Check")
      .setDescription(
        `Witaj ${ticketAuthor.user}, widzimy, że zakupiłeś u nas produkt. Prosimy o wykonanie poniższych czynności:\n\n` +
        `• Wystaw opinię używając komendy /opinia\n` +
        `• Zaznacz reakcję na kanale czy legit\n\n` +
        `Życzymy miłego dnia i zachęcamy do kupowania u nas w przyszłości!`
      );

    await i.channel.send({ content: `${ticketAuthor}`, embeds: [embed] });
    await i.channel.send(`Napisz voucha:\n+rep @chudy_33 (produkt) (cena)`);

    await i.reply({ content: "✅ Instrukcje wysłane", ephemeral: true });
  }

  // ===== EXCHANGE =====
  if (i.isChatInputCommand() && i.commandName === "exchange") {
    const modal = new ModalBuilder()
      .setCustomId("exchange-modal")
      .setTitle("💱 Dokonaj wymiany kontem");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("login")
          .setLabel("Login konta")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("password")
          .setLabel("Hasło konta")
          .setStyle(TextInputStyle.Short)
