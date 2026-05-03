const { EmbedBuilder } = require("discord.js");
const Data = require("pro.db");
const Pro = require("pro.db");

module.exports = {
  name: "unban-all",
  aliases: ["unbanal"],
  description: "لإلغاء الحظر عن الجميع",
  run: async (client, message, args) => {
    const isEnabled = Data.get(
      `command_enabled_${module.exports.name}`
    );
    if (isEnabled === false) return;

    const dbVal = Pro.get(
      `Allow - Command ban = [ ${message.guild.id} ]`
    );
    const allowedRole = message.guild.roles.cache.get(dbVal);
    const isAuthorAllowed = message.member.roles.cache.has(
      allowedRole?.id
    );

    if (
      !isAuthorAllowed &&
      message.author.id !== dbVal &&
      !message.member.permissions.has("Administrator")
    ) {
      return;
    }

    try {
      const bans = await message.guild.bans.fetch();
      if (!bans.size) {
        return message.channel.send({
          content: "**لا توجد اعضاء محظوريين ! 🙄**",
        });
      }

      for (const ban of bans.values()) {
        await message.guild.members.unban(ban.user).catch(() => {});
      }

      const logbanunban = Pro.get(
        `logbanunban_${message.guild.id}`
      );
      const logChannel =
        message.guild.channels.cache.get(logbanunban);

      if (logChannel) {
        const executor = message.author;
        const logEmbed = new EmbedBuilder()
          .setAuthor({
            name: executor.tag,
            iconURL: executor.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `**فك الحظر**\n\n**تم فك الحظر عن جميع الأعضاء**\n**بواسطة: ${executor}**\n\`\`\`Their number : ${bans.size}\`\`\`\ `
          )
          .setColor(`#880013`)
          .setThumbnail(
            "https://cdn.discordapp.com/attachments/1091536665912299530/1209557672299466804/unbanall.png"
          )
          .setFooter({
            text: message.guild.name,
            iconURL: message.guild.iconURL({ dynamic: true }),
          })
          .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
      }

      message.reply({
        content: `! **تم إلغاء الحظر بنجاح عن \`${bans.size}\` أعضاء ✅**\nتم فك جميع الباند بنجاح.`,
        allowedMentions: { parse: [] },
      });
    } catch (err) {
      console.error(err);
      message.reply({
        content: "حدث خطأ أثناء تنفيذ الأمر",
        allowedMentions: { parse: [] },
      });
    }
  },
};
