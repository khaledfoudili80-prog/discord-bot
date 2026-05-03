const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");

const db = require("pro.db");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // مهم جداً
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
client.aliases = new Collection();

/* =========================
   تحميل الأوامر
========================= */
const commandsPath = path.join(__dirname, "Commands");
const cats = fs.readdirSync(commandsPath);

for (const cat of cats) {
  const catPath = path.join(commandsPath, cat);
  const files = fs.readdirSync(catPath).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const cmdPath = path.join(catPath, file);

    try {
      const cmd = require(cmdPath);

      if (!cmd || !cmd.name) {
        console.warn(`⚠️ Missing name: ${cat}/${file}`);
        continue;
      }

      client.commands.set(cmd.name.toLowerCase(), cmd);

      if (Array.isArray(cmd.aliases)) {
        cmd.aliases.forEach((al) => {
          client.aliases.set(al.toLowerCase(), cmd.name.toLowerCase());
        });
      }

      console.log(`✅ Loaded command: ${cat}/${cmd.name}`);
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err);
    }
  }
}

/* =========================
   تحميل الأحداث
========================= */
const eventsRoot = path.join(__dirname, "events");

fs.readdirSync(eventsRoot).forEach((folder) => {
  const fullFolder = path.join(eventsRoot, folder);

  if (!fs.lstatSync(fullFolder).isDirectory()) return;

  const eventFiles = fs
    .readdirSync(fullFolder)
    .filter((f) => f.endsWith(".js"));

  for (const file of eventFiles) {
    const evPath = path.join(fullFolder, file);
    const eventName = file.split(".")[0];

    try {
      const eventFn = require(evPath);

      if (eventName === "ready") {
        client.once("ready", (...args) => eventFn(client, ...args));
      } else {
        client.on(eventName, (...args) => eventFn(client, ...args));
      }

      console.log(`⚡ Loaded event: ${folder}/${file}`);
    } catch (err) {
      console.error(`❌ Event error ${file}:`, err);
    }
  }
});

/* =========================
   🔥 FIX: تشغيل الأوامر
========================= */
client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const prefix = config.prefix || "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmdName = args.shift().toLowerCase();

  const command =
    client.commands.get(cmdName) ||
    client.commands.get(client.aliases.get(cmdName));

  if (!command) return;

  try {
    command.run(client, message, args);
  } catch (err) {
    console.error("❌ Command error:", err);
  }
});

/* =========================
   تشغيل البوت
========================= */
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);