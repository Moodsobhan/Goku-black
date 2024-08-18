const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: 'checkban',
    version: '1.0',
    author: 'Mahi--',
    countDown: 15,
    role: 0,
    shortDescription: 'Check if bot is media banned',
    longDescription: 'Check if the bot is banned from sending media.',
    category: 'system',
    guide: {
      en: '{pn}: Check if the bot is media banned.'
    }
  },

  onStart: async function ({ message, api }) {
    const checkImageURL = "https://i.ibb.co/2ntpM69/image.jpg";
    const checkMessage = await message.reply("🔄 Checking media ban...");

    try {
      // Attempt to send the image
      const attachment = await getStreamFromURL(checkImageURL);
      await api.sendMessage({
        body: "Media not banned. ✅",
        attachment: attachment
      }, message.threadID, async () => {
        // If the image was sent successfully, edit the initial message
        await api.editMessage("✅ The bot's media is not banned.", checkMessage.messageID);
      });
    } catch (error) {
      // If the image could not be sent, edit the initial message to indicate a media ban
      console.error(error);
      await api.editMessage("🚫 The bot's media has been banned.", checkMessage.messageID);
    }
  }
};

// Anti-author change system
Object.defineProperty(module.exports.config, 'author', {
  value: 'Mahi--',
  writable: false,
  configurable: false,
  enumerable: true
});
