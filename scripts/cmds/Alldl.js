const axios = require('axios');

module.exports = {
  config: {
    name: "alldl",
    aliases: [],
    version: "1.0",
    author: "Mahi--",
    countDown: 5,
    role: 0,
    longDescription: "Download video from provided URL",
    category: 'downloader',
    guide: {
      en: "{pn} <url>"
    }
  },
  onStart: async function ({ message, args }) {
    try {
      let url = args.join(" ");
      if (!url) return message.reply("Please provide a URL to download the video.");

      const batman = (await axios.get(`https://throw-apis.onrender.com/scrape/download?url=${url}`)).data;

      let headers = batman.formats[0].headers;

      if (batman.formats[0].cookies) {
        headers['Cookie'] = batman.formats[0].cookies;
      }

      const stream = await axios({
        method: 'get',
        url: batman.formats[0].url,
        headers: headers,
        responseType: 'stream'
      });

      message.reply({
        body: `• ${batman.title}\n• Source: ${batman.source}\n• Duration: ${batman.duration}\n• Format: ${batman.formats[0].format}\n• Quality: ${batman.formats[0].quality}`,
        attachment: stream.data
      });
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while trying to download the video.");
    }
  }
};
