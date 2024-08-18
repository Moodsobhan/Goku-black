const os = require('os');
const { bold, thin } = require("fontstyles");

module.exports = {
  config: {
    name: 'uptime',
    aliases: ['stats', 'status', 'system', 'rtm'],
    version: '1.3',
    author: 'Mahi--',
    countDown: 15,
    role: 0,
    shortDescription: 'Display bot uptime and system stats with media ban check',
    longDescription: {
      id: 'Display bot uptime and system stats with media ban check',
      en: 'Display bot uptime and system stats with media ban check'
    },
    category: 'system',
    guide: {
      id: '{pn}: Display bot uptime and system stats with media ban check',
      en: '{pn}: Display bot uptime and system stats with media ban check'
    }
  },
  onStart: async function ({ message, event, usersData, threadsData, api }) {
    // Anti-Author Change Check
    if (this.config.author !== 'Mahi--') {
      return message.reply("⚠️ Unauthorized author change detected. Command execution stopped.");
    }

    const startTime = Date.now();
    const users = await usersData.getAll();
    const groups = await threadsData.getAll();
    const uptime = process.uptime();

    try {
      // Uptime calculation
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      // System Stats
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercentage = (usedMemory / totalMemory * 100).toFixed(2);

      const cpuUsage = os.loadavg();
      const cpuCores = os.cpus().length;
      const cpuModel = os.cpus()[0].model;
      const nodeVersion = process.version;
      const platform = os.platform();
      const networkInterfaces = os.networkInterfaces();

      const networkInfo = Object.keys(networkInterfaces).map(interface => {
        return {
          interface,
          addresses: networkInterfaces[interface].map(info => `${info.family}: ${info.address}`)
        };
      });

      const endTime = Date.now();
      const botPing = endTime - startTime;

      // Create the initial message content with system stats and media check placeholder
      const initialMessageContent = `🖥 ${bold("System Statistics")}:\n\n` +
        `• Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s\n` +
        `• Memory Usage: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB\n` +
        `• Total Memory: ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
        `• Free Memory: ${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
        `• Memory Usage Percentage: ${memoryUsagePercentage}%\n` +
        `• CPU Usage (1m): ${cpuUsage[0].toFixed(2)}%\n` +
        `• CPU Usage (5m): ${cpuUsage[1].toFixed(2)}%\n` +
        `• CPU Usage (15m): ${cpuUsage[2].toFixed(2)}%\n` +
        `• CPU Cores: ${cpuCores}\n` +
        `• CPU Model: ${cpuModel}\n` +
        `• Node.js Version: ${nodeVersion}\n` +
        `• Platform: ${platform}\n` +
        `• Ping: ${botPing}ms\n• Total Users: ${users.length}\n• Total Groups: ${groups.length}\n\n` +
        `🌐 ${bold("Network Interfaces")}:\n\n` +
        `${networkInfo.map(info => `• ${info.interface}: ${info.addresses.join(', ')}`).join('\n')}\n\n` +
        `🔄 ${thin("𝖢𝗁𝖾𝖼𝗄𝗂𝗇𝗀 𝗆𝖾𝖽𝗂𝖺 𝖻𝖺𝗇 𝗌𝗍𝖺𝗍𝗎𝗌...")}`;

      // Send the initial message
      const sentMessage = await message.reply(initialMessageContent);

      // Delay the media ban check
      setTimeout(async () => {
        try {
          const mediaBan = await threadsData.get(event.threadID, 'mediaBan') || false;
          const mediaBanStatus = mediaBan ? '🚫 Media is currently banned in this chat.' : '✅ Media is not banned in this chat.';
          
          // Combine system stats and media ban status
          const updatedMessageContent = `${initialMessageContent.replace(`🔄 ${thin("𝖢𝗁𝖾𝖼𝗄𝗂𝗇𝗀 𝗆𝖾𝖽𝗂𝖺 𝖻𝖺𝗇 𝗌𝗍𝖺𝗍𝗎𝗌...")}`, mediaBanStatus)}`;
          
          // Edit the message to include media ban status
          return api.editMessage(thin(updatedMessageContent), sentMessage.messageID);
        } catch (err) {
          console.error(err);
          return api.editMessage(thin(`${initialMessageContent}\n\n❌ An error occurred while checking the media ban status.`), sentMessage.messageID);
        }
      }, 1000); // Delay for 1 second
    } catch (err) {
      console.error(err);
      return message.reply("❌ An error occurred while fetching system statistics.");
    }
  }
};
