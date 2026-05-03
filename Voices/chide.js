const {
  EmbedBuilder,
  Colors,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "chide",
  description: "Hide all voice channels from a specific member",
  async run(client, message) {
    const member = message.mentions.members.first();

    const db = Pro.get(`Allow - Command chide = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (
      !isAuthorAllowed &&
      message.author.id !== db &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) return message.react("❌");

    if (!member) return message.reply("يرجى ذكر العضو الذي تريد إخفاء القنوات عنه.");

    const voiceChannels = message.guild.channels.cache.filter(
      (ch) => ch.type === ChannelType.GuildVoice
    );
    if (voiceChannels.size === 0) return message.reply("لا توجد قنوات صوتية في هذا الخادم.");

    try {
      for (const ch of voiceChannels.values()) {
        await ch.permissionOverwrites.edit(member, { ViewChannel: false });
      }
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle("تم تحديث إذن الدخول")
        .setDescription(`🔒 تم إخفاء جميع القنوات الصوتية عن ${member}.`)
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      return message.reply("حدث خطأ أثناء محاولة إخفاء القنوات.");
    }
  },
};
