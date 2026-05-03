const {
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const deb = require("pro.db");

module.exports = {
  name: "warn",
  aliases: ["انذار", "تحذير", "تح"],
  description: "يعطي تحذيرًا لعضو ما.",
  run: async (client, message, args) => {
    const isEnabled = deb.get(`command_enabled_warn`);
    if (isEnabled === false) return;

    const Color =
      deb.get(`Guild_Color = ${message.guild.id}`) || "#f5f5ff";

    const allowVal = deb.get(
      `Allow - Command warn = [ ${message.guild.id} ]`
    );
    const allowRole = message.guild.roles.cache.get(allowVal);
    const canUse =
      message.member.roles.cache.has(allowRole?.id) ||
      message.author.id === allowVal ||
      message.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      );

    if (!canUse) return;

    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    const reason_msg = args.slice(1).join(" ");

    if (!member) {
      return message.reply({
        content: "**يرجى ارفاق منشن العضو او الايدي .**",
        allowedMentions: { parse: [] },
      });
    }

    if (member.id === message.author.id) {
      return message.reply({
        content: "🙄 **ما تقدر تعطي نفسك تحذير**",
        allowedMentions: { parse: [] },
      });
    }

    if (
      message.member.roles.highest.position <
      member.roles.highest.position
    ) {
      return message.reply({
        content: "🙄 **ما تقدر تعطي تحذير لرتبة أعلى منك**",
        allowedMentions: { parse: [] },
      });
    }

    if (!reason_msg) {
      return message.reply({
        content: "🙄**يرجى كتابة سبب للتحذير**",
        allowedMentions: { parse: [] },
      });
    }

    deb.add(`warns_${member.id}`, 1);
    const Warn = deb.get(`warns_${member.id}`);
    deb.set(`messageauthor_${member.id}`, message.author.id);
    deb.set(`reason_${member.id}`, reason_msg);
    deb.set(`time_${member.id}`, Date.now());

    message.react("✅").catch(() => {});

    const logId = deb.get(`logwarns_${message.guild.id}`);
    const logChannel = message.guild.channels.cache.get(logId);

    const embed = new EmbedBuilder()
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1091536665912299530/1224819138103476387/warning.png"
      )
      .setColor(Color)
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `**إنذار جديد**\nالعضو: <@${member.id}>\nالتحذير رقم: **${Warn}**\nبواسطة: <@${message.author.id}>\n\`\`\`${reason_msg}\`\`\``
      )
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    member.send({ embeds: [embed] }).catch(() => {});
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
