const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "cunhide",
  description: "Unhide all voice channels for a specific member",
  async run(client, message) {
    const db = Pro.get(`Allow - Command cunhide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (
      !isAuthorAllowed &&
      message.author.id !== db &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) return message.react("❌");

    const member = message.mentions.members.first();
    if (!member) return message.reply("يرجى ذكر العضو الذي تريد إظهار القنوات له.");

    const voiceChannels = message.guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    );
    if (voiceChannels.size === 0) return message.reply("لا توجد قنوات صوتية في هذا الخادم.");

    try {
      for (const ch of voiceChannels.values()) {
        await ch.permissionOverwrites.edit(member, { ViewChannel: true });
      }
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle("تم تحديث الإذن")
        .setDescription(`🔓 جميع القنوات الصوتية أصبحت مرئية لـ ${member}.`)
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return message.reply("حدث خطأ أثناء محاولة إظهار القنوات.");
    }
  },
};
