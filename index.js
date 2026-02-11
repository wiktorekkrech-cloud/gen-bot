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
  Routes,
  SelectMenuBuilder
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
    .setDescription("Wysyła instrukcje do repa na tickecie")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log("✅ Bot działa");

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
  console.log("✅ /opinia, /drop i /rep zarejestrowane");
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
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket-settings")
        .setLabel("⚙️ Ustawienia")
        .setStyle(ButtonStyle.Secondary)
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

  // ===== TICKET SETTINGS =====
  if (i.isButton() && i.customId === "ticket-settings") {
    const settingsEmbed = new EmbedBuilder()
      .setColor(COLOR_ORANGE)
      .setTitle("⚙️ Ustawienia ticketu")
      .setDescription("Wybierz akcję poniżej:");

    const settingsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("add-member")
        .setLabel("Dodaj użytkownika")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("remove-member")
        .setLabel("Usuń użytkownika")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("rep-ticket")
        .setLabel("Wyślij rep")
        .setStyle(ButtonStyle.Success)
    );

    await i.reply({ embeds: [settingsEmbed], components: [settingsRow], ephemeral: true });
  }

  // ===== ADD/REMOVE MEMBER =====
  if (i.isButton() && (i.customId === "add-member" || i.customId === "remove-member")) {
    const members = i.guild.members.cache.map(m => ({
      label: m.user.username,
      value: m.id
    })).slice(0, 25); // max 25 opcji w select menu

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(i.customId)
        .setPlaceholder("Wybierz członka")
        .addOptions(members)
    );

    await i.reply({ content: "Wybierz członka:", components: [selectMenu], ephemeral: true });
  }

  if (i.isStringSelectMenu() && (i.customId === "add-member" || i.customId === "remove-member")) {
    const memberId = i.values[0];
    const member = await i.guild.members.fetch(memberId);

    if (i.customId === "add-member") {
      await i.channel.permissionOverwrites.edit(memberId, { ViewChannel: true });
      await i.reply({ content: `✅ Dodano ${member.user.tag} do ticketu`, ephemeral: true });
    } else {
      await i.channel.permissionOverwrites.edit(memberId, { ViewChannel: false });
      await i.reply({ content: `✅ Usunięto ${member.user.tag} z ticketu`, ephemeral: true });
    }
  }

  // ===== REP =====
  if (i.isButton() && i.customId === "rep-ticket") {
    const creatorId = i.channel.permissionOverwrites.cache.find(o => o.allow.has(PermissionsBitField.Flags.ViewChannel))?.id;
    const creator = await i.guild.members.fetch(creatorId);

    const embed = new EmbedBuilder()
      .setColor(COLOR_PREMIUM)
      .setTitle("Lumyx Stock × Legit Check")
      .setDescription(
        `Witaj ${creator}\n` +
        `• Wystaw opinię używając komendy /opinia\n` +
        `• Zaznacz reakcję na kanale czy legit\n\n` +
        `Życzymy miłego dnia!`
      );

    await i.channel.send({ embeds: [embed] });
    await i.reply({ content: "✅ Rep wysłany", ephemeral: true });
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
      .set
const rewardInput = new TextInputBuilder()
      .setCustomId("reward")
      .setLabel("Co jest nagrodą?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel("Ile nagród?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(rewardInput),
      new ActionRowBuilder().addComponents(quantityInput)
    );

    await i.showModal(modal);
  }

  if (i.isModalSubmit() && i.customId === "drop-modal") {
    const reward = i.fields.getTextInputValue("reward");
    const quantity = i.fields.getTextInputValue("quantity");

    const embed = new EmbedBuilder()
      .setColor(COLOR_PREMIUM)
      .setTitle("🎁 Nowy drop!")
      .setDescription(`Nagroda: **${reward}**\nIlość: **${quantity}**`);

    await i.channel.send({ embeds: [embed] });
    await i.reply({ content: "✅ Drop utworzony", ephemeral: true });
  }

  // ===== REP COMMAND =====
  if (i.isChatInputCommand() && i.commandName === "rep") {
    const creatorId = i.channel.permissionOverwrites.cache.find(o => o.allow.has(PermissionsBitField.Flags.ViewChannel))?.id;
    if (!creatorId) return i.reply({ content: "❌ Nie mogę znaleźć twórcy ticketu", ephemeral: true });

    const creator = await i.guild.members.fetch(creatorId);

    const embed = new EmbedBuilder()
      .setColor(COLOR_PREMIUM)
      .setTitle("Lumyx Stock × Legit Check")
      .setDescription(
        `Witaj ${creator}\n` +
        `• Wystaw opinię używając komendy /opinia\n` +
        `• Zaznacz reakcję na kanale czy legit\n\n` +
        `Życzymy miłego dnia!`
      );

    await i.channel.send({ embeds: [embed] });
    await i.reply({ content: "✅ Rep wysłany", ephemeral: true });
  }

});

client.login(process.env.TOKEN);
