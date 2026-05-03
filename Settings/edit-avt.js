const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "edit-avt",
  description: "Edit avatar/link channels and related settings",
  run: async (client, message, args) => {
    if (!owners.includes(message.author.id)) return message.react("❌");
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("vipMenu")
        .setPlaceholder("اختر إحدى الخيارات")
        .addOptions(
          { label: "نشر الروابط",  emoji: "⏳", description: "🔗 انشاء شاتات نشر الروابط",              value: "sharing" },
          { label: "حذف شاتات",    emoji: "⏳", description: "🔗 حذف شاتات نشر الروابط",                value: "sharingdel" },
          { label: "تعين شاتات",   emoji: "⏳", description: "🖼️ تعين شاتات نشر صور الافتارت",          value: "avtchannels" },
          { label: "حذف شاتات",    emoji: "⏳", description: "🖼️ حذف جميع شاتات نشر صور الافتارت",     value: "avtdelete" },
          { label: "عرض القائمة",  emoji: "⏳", description: "🖼️ عرض قائمة شاتات صور الآفتارت المحفوظه", value: "showavtchannels" },
          { label: "تحديد الخط",   emoji: "⏳", description: "🖼️ إضافه/حذف الخط المروبط مع شاتات الصور", value: "avtline" },
          { label: "تفعيل/إلغاء",  emoji: "⏳", description: "🖼️ تفعيل أو إلغاء الامبيد بالصور",       value: "toggleFeature" },
          { label: "تحديد شات",    emoji: "⏳", description: "💬 تحديد شات المسح التلقائي",            value: "avtchannelcolors" },
          { label: "تعديل رسالة",  emoji: "⏳", description: "💬 تعديل رسالة المسح التلقائي",          value: "savedText" },
          { label: "تعديل صورة",   emoji: "⏳", description: "💬 إضافة/حذف صورة بدال صورة الألوان",     value: "savedImageUrl" },
        )
    );

    const cancel = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("Cancel").setLabel("إلغاء").setStyle(ButtonStyle.Danger)
    );

    const panel = await message.reply({ content: "**قائمة آوامر تعديل الافتارت**.", components: [menu, cancel] });

    const collector = panel.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && ["vipMenu", "Cancel"].includes(i.customId),
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "Cancel") {
        await panel.delete().catch(()=>{});
        return;
      }
      if (!i.isStringSelectMenu() || !i.values?.length) return;
      await i.deferUpdate();
      const choice = i.values[0];

      if (choice === "sharing") {
        await panel.delete().catch(()=>{});
        const category = await message.guild.channels.create({
          name: "Link:",
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: message.guild.id, deny: [PermissionsBitField.Flags.SendMessages] },
          ],
          reason: "إنشاء قنوات نشر الروابط",
        });

        const serverRoom = await message.guild.channels.create({ name: "serv", type: ChannelType.GuildText, parent: category.id });
        const avatarRoom = await message.guild.channels.create({ name: "avvt", type: ChannelType.GuildText, parent: category.id });
        const shopRoom   = await message.guild.channels.create({ name: "shop", type: ChannelType.GuildText, parent: category.id });

        Pro.set(`server_${message.guild.id}`, serverRoom.id);
        Pro.set(`avatar_${message.guild.id}`, avatarRoom.id);
        Pro.set(`shop_${message.guild.id}`, shopRoom.id);

        return message.reply("**تم إنشاء شاتات نشر الروابط بنجاح** ✅");
      }

      if (choice === "sharingdel") {
        await panel.delete().catch(()=>{});

        const ids = [
          Pro.get(`server_${message.guild.id}`),
          Pro.get(`avatar_${message.guild.id}`),
          Pro.get(`shop_${message.guild.id}`),
        ].filter(Boolean);

        for (const id of ids) {
          const ch = message.guild.channels.cache.get(id);
          if (ch) await ch.delete().catch(()=>{});
        }

        Pro.delete(`server_${message.guild.id}`);
        Pro.delete(`avatar_${message.guild.id}`);
        Pro.delete(`shop_${message.guild.id}`);

        return message.reply("**تم حذف شاتات نشر الروابط بنجاح** ✅");
      }

      if (choice === "avtchannels") {
        await panel.delete().catch(()=>{});
        let selected = [];

        if (args.length > 0) {
          for (const token of args) {
            const id = token.replace(/\D/g, "");
            const ch = message.guild.channels.cache.get(id);
            if (ch && !selected.includes(id)) selected.push(id);
          }
        }

        if (selected.length === 0) {
          const ask = await message.reply("**يرجى إرفاق منشن الشات أو الأيدي** ⚙️");
          const c = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, time: 30_000 });

          c.on("collect", (msg) => {
            msg.mentions.channels.forEach((ch) => { if (!selected.includes(ch.id)) selected.push(ch.id); });
            const ids = msg.content.match(/(?:<#(\d+)>|(\d+))/g);
            if (ids) ids.forEach((x) => { const id = x.replace(/<#|>/g, ""); if (!selected.includes(id)) selected.push(id); });
            c.stop();
          });

          c.on("end", () => {
            if (selected.length === 0) return ask.edit("**أنتهى وقت التعديل** ❌");
            selected.forEach((id) => Pro.push(`avtchats-[${message.guild.id}]`, id));
            ask.edit("**تم حفظ الشات بنجاح.** ✅");
          });
        } else {
          selected.forEach((id) => {
            const list = Pro.get(`avtchats-[${message.guild.id}]`) || [];
            if (!list.includes(id)) Pro.push(`avtchats-[${message.guild.id}]`, id);
          });
          message.reply("**تم حفظ الشات بنجاح.** ✅");
        }
        return;
      }

      if (choice === "showavtchannels") {
        await panel.delete().catch(()=>{});
        const saved = Pro.get(`avtchats-[${message.guild.id}]`) || [];
        if (saved.length === 0) return message.reply("**لا يوجد شاتات محفوظة.** ❌");

        const totalPages = Math.ceil(saved.length / 10);
        let page = 1;

        const view = () => {
          const start = (page - 1) * 10;
          const end = page * 10;
          const lines = saved.slice(start, end).map((id, i) => {
            const ch = message.guild.channels.cache.get(id);
            return ch ? `\`#${start + i + 1}\` <#${ch.id}> (${ch.id})` : `\`#${start + i + 1}\` (محذوف) (${id})`;
          });

          const controls = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("prev").setEmoji("⬅️").setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
            new ButtonBuilder().setCustomId("next").setEmoji("➡️").setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages)
          );

          return { content: `قائمة شاتات الافتارت المحفوظة:\n${lines.join("\n")}`, components: [controls] };
        };

        const msg = await message.channel.send(view());
        const pager = msg.createMessageComponentCollector({
          filter: (ii) => ii.user.id === message.author.id && ["prev", "next"].includes(ii.customId),
          time: 60_000,
        });

        pager.on("collect", async (ii) => {
          if (ii.customId === "prev") page = Math.max(1, page - 1);
          if (ii.customId === "next") page = Math.min(totalPages, page + 1);
          await ii.update(view());
        });

        pager.on("end", () => {
          msg.edit({ components: [] }).catch(()=>{});
        });
        return;
      }

      if (choice === "avtdelete") {
        await panel.delete().catch(()=>{});
        const saved = Pro.get(`avtchats-[${message.guild.id}]`);
        if (!saved || saved.length === 0) return message.reply("**لا يوجد شاتات محفوظة لحذفها.** ❌");
        Pro.delete(`avtchats-[${message.guild.id}]`);
        return message.reply("**تم حذف شاتات الافتارت من بنجاح.** ✅");
      }

      if (choice === "avtline") {
        await panel.delete().catch(()=>{});
        const existing = Pro.get(`Line`);
        if (existing) {
          Pro.delete(`Line`);
          return message.reply("**تم حذف الخط السابق بنجاح. ✅**");
        }

        let imageURL;
        if (args[0]) imageURL = args[0];
        else if (message.attachments.size > 0) imageURL = message.attachments.first().url;
        else {
          const ask = await message.reply("**يرجى أرفاق رابط الخط او الخط** ⚙️");
          const c = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, time: 60_000 });
          c.on("collect", async (msg) => {
            if (msg.attachments.size > 0) {
              imageURL = msg.attachments.first().url;
              await saveLine(imageURL);
              message.react("✅");
              ask.edit("**تم حفظ الخط بنجاح ✅**");
              await msg.delete().catch(()=>{});
              c.stop();
            } else {
              msg.reply("**يرجى أرفاق رابط الخط او الخط** ⚙️");
            }
          });
          c.on("end", () => { if (!imageURL) ask.edit("**أنتهى وقت التعديل** ❌"); });
          return;
        }
        await saveLine(imageURL);
        return message.reply("**تم حفظ الخط بنجاح ✅**");
      }

      if (choice === "avtchannelcolors") {
        await panel.delete().catch(()=>{});
        let selectedId;

        if (args[0]) {
          const id = args[0].replace(/\D/g, "");
          if (message.guild.channels.cache.has(id)) selectedId = id;
        }
        if (!selectedId) {
          const ask = await message.reply("**يرجى ارفاق منشن الشات او الايدي ** ⚙️");
          const c = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, time: 30_000 });
          c.on("collect", (msg) => {
            const ch = msg.mentions.channels.first();
            if (ch) { selectedId = ch.id; c.stop(); }
            else {
              const id = msg.content.replace(/\D/g, "");
              if (message.guild.channels.cache.has(id)) { selectedId = id; c.stop(); }
              else msg.reply("**يرجى ارفاق منشن الشات او الايدي **⚙️");
            }
          });
          c.on("end", () => {
            if (!selectedId) ask.edit("**أنتهى وقت التعديل** ❌");
            else { Pro.set(`avtchatcolors`, selectedId); ask.edit("**تم حفظ القناة بنجاح** ✅"); }
          });
        } else {
          Pro.set(`avtchatcolors`, selectedId);
          message.reply("**تم حفظ القناة بنجاح** ✅");
        }
        return;
      }

      if (choice === "savedText") {
        await panel.delete().catch(()=>{});
        let text = args.length ? args.join(" ") : null;
        if (!text) {
          const ask = await message.reply("**يرجى ارفاق رسالة علبه الالوان الجديدة **⚙️");
          const c = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, time: 30_000 });
          c.on("collect", (msg) => { text = msg.content; c.stop(); });
          c.on("end", () => {
            if (!text) ask.edit("**أنتهى وقت التعديل** ❌");
            else { Pro.set(`savedText_${message.guild.id}`, text); ask.edit("**تم حفظ النص بنجاح** ✅"); }
          });
        } else {
          Pro.set(`savedText_${message.guild.id}`, text);
          message.reply("**تم حفظ النص بنجاح.** ✅");
        }
        return;
      }

      if (choice === "savedImageUrl") {
        await panel.delete().catch(()=>{});
        const exists = Pro.get(`savedImageUrl_${message.guild.id}`);
        if (exists) {
          Pro.delete(`savedImageUrl_${message.guild.id}`);
          return message.reply("**تم حذف الصورة السابقة بنجاح ** ✅");
        }

        let url;
        if (args[0]) {
          url = args[0];
          await saveImageUrl(message.guild.id, url);
          return message.reply("**تم حفظ الصورة بنجاح ** ✅");
        } else if (message.attachments.size > 0) {
          url = message.attachments.first().url;
          await saveImageUrl(message.guild.id, url);
          return message.reply("**تم حفظ الصورة بنجاح.** ✅");
        } else {
          const ask = await message.reply("**يرجى أرفاق رابط الصورة او الصورة ** ⚙️");
          const c = message.channel.createMessageCollector({ filter: (m) => m.author.id === message.author.id, time: 60_000 });
          c.on("collect", async (msg) => {
            if (msg.attachments.size > 0) {
              url = msg.attachments.first().url;
              await saveImageUrl(message.guild.id, url);
              message.react("✅");
              ask.edit("**تم حفظ الصورة بنجاح  ✅**");
              await msg.delete().catch(()=>{});
              c.stop();
            } else {
              msg.reply("**يرجى أرفاق الصورة او الرابط ** ⚙️");
            }
          });
          c.on("end", () => { if (!url) ask.edit("**أنتهى وقت التعديل** ❌"); });
        }
        return;
      }

      if (choice === "toggleFeature") {
        await panel.delete().catch(()=>{});
        let imageStatus = Pro.get(`ImageStatus_${message.guild.id}`) || "on";
        imageStatus = imageStatus === "off" ? "on" : "off";
        Pro.set(`ImageStatus_${message.guild.id}`, imageStatus);
        const msg = imageStatus === "on" ? "**تم تفعيل عرض الصورة بـ امبيد ✅**" : "**تم تفعيل عرض الصور بدون امبيد ✅**";
        return message.reply(msg);
      }
    });

    async function saveLine(imageUrl) {
      const imagePath = path.join(process.cwd(), "Fonts", "line.png");
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();
      fs.writeFileSync(imagePath, buffer);
      Pro.set(`Line`, imagePath);
    }

    async function saveImageUrl(guildId, imageUrl) {
      const imagePath = path.join(process.cwd(), "Fonts", "imagecolors.png");
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();
      fs.writeFileSync(imagePath, buffer);
      Pro.set(`savedImageUrl_${guildId}`, imagePath);
    }
  },
};
