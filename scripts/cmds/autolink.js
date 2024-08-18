const axios = require('axios');

module.exports = {
  config: {
    name: "download",
    aliases: ["downloader"],
    version: "1.1",
    author: "jsus && tanvir",
    countDown: 5,
    role: 0,
    longDescription: "Download Videos from various Sources.",
    category: "media",
    guide: { en: { body: "{pn} [ video link ]" } }
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    const videoUrl = args.join(" ");
    if (args[0] === 'chat' && (args[1] === 'on' || args[1] === 'off') || args[0] === 'on' || args[0] === 'off') {
      if (role >= 2) {
        const choice = args[0] === 'on' || args[1] === 'on';
        await threadsData.set(event.threadID, { data: { autoDownload: choice } });
        return message.reply(`Auto-download has been turned ${choice ? 'on' : 'off'} for this group.`);
      } else {
        return message.reply("Lowly Socio Economic Peasant");
      }
    }
    if (!videoUrl) {
      return message.reply(`Provide an URL to start Downloading.`);
    } else {
      message.reaction("⏳", event.messageID);
      await download({ videoUrl, message, event });
    }
  },
  onChat: async function({ event, message, threadsData }) {
    const x = await threadsData.get(event.threadID);
    if (!x.data.autoDownload || x.data.autoDownload === false || event.senderID === global.botID) return;
    try {
      const urlRegx = /https:\/\/[^\s]+/;
      const match = event.body.match(urlRegx);
      let axtrLink;
      if (match) {
        const prefix = await global.utils.getPrefix(event.threadID);
        if (event.body.startsWith(prefix)) {
          return;
        }
        axtrLink = match[0];
        message.reaction("⏳", event.messageID);
        await download({ videoUrl: axtrLink, message, event });
      } else {
        return;
      }
    } catch (e) {
message.reaction("😭", event.messageID);
    }
  }
};

async function download({ videoUrl, message, event }) {
  try {
    const batman = (await axios.get(`https://throw-apis.onrender.com/scrape/download?url=${videoUrl}`)).data;
    let success = false;

    for (let i = 0; i < batman.formats.length; i++) {
      try {
        let headers = batman.formats[i].headers;

        if (batman.formats[i].cookies) {
          headers['Cookie'] = batman.formats[i].cookies;
        }

        const stream = await axios({
          method: 'get',
          url: batman.formats[i].url,
          headers: headers,
          responseType: 'stream'
        });

        message.reply({ 
          body: `• ${batman.title}\n• source: ${batman.source}`,
          attachment: stream.data 
        });

        message.reaction("✅", event.messageID);
        success = true;
        break;
      } catch (error) {
        if (i === batman.formats.length - 1) {
          message.reaction("😭", event.messageID);
        }
      }
    }

    if (!success) {
      message.reaction("😭", event.messageID);
    }
  } catch (error) {
    message.reaction("😭", event.messageID);
  }
}
