const { EmbedBuilder } = require("discord.js");
const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: "antiserveurl",
  description: "تشغيل أو إيقاف حماية روابط الدعوة.",
  usage: ` antiserveurl <on|off>`,
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");

    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
      return message.reply(
        `❌ استخدم الأمر بشكل صحيح:\n\` antiserveurl <on|off>\``
      );
    }

    const guildId = message.guild.id;

    if (status === "on") {
      const invites = await message.guild.invites.fetch();
      const firstInvite = invites.first();

      if (!firstInvite)
        return message.reply(
          "⚠️ لا توجد روابط دعوة حالياً. يرجى إنشاء دعوة أولاً."
        );

      await db.set(`savedInviteUrl_${guildId}`, firstInvite.url);
      console.log(
        `🔒 AntiServeURL: حفظ الرابط ${firstInvite.url} للسيرفر ${message.guild.name}`
      );
    } else {
      console.log(`🔓 AntiServeURL: تم إيقاف الحماية في ${message.guild.name}`);
    }

    await db.set(`antiServeUrl_${guildId}`, status === "on");

    const embed = new EmbedBuilder()
      .setColor(status === "on" ? 0x2ecc71 : 0xe74c3c)
      .setTitle("إعداد حماية روابط الدعوة")
      .setDescription(
        `تم **${status === "on" ? "تفعيل" : "إيقاف"}** حماية روابط الدعوة في هذا السيرفر.`
      );

    message.channel.send({ embeds: [embed] });
  },
};
