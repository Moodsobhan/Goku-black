const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.18",
    author: "NTKhang",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "View command usage",
    },
    longDescription: {
      en: "View command usage, list all commands, or search commands by the first letter",
    },
    category: "info",
    guide: {
      en: "{pn} / help cmdName \n{pn} / help -s <letter> (to search commands by the first letter)",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    if (args.length === 0) {
      let msg = `╔═══✦✧✦═══╗\n   👽 𝘼𝙣𝙘𝙝𝙚𝙨𝙩𝙤𝙧 𝘼𝙞 👽\n╚═══✦✧✦═══╝\n\n`;

      const categories = {};

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        const category = value.config.category || "Uncategorized";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      for (const category in categories) {
        msg += `\n╭────✦  ${category.toUpperCase()}  ✦────╮\n`;
        msg += categories[category].sort().join(" ✧ ") + "\n";
        msg += `╰────✦────────────✦────╯`;
      }

      const totalCommands = commands.size;
      msg += `\n\nCurrently, this bot has ${totalCommands} commands available.\n`;
      msg += `Type ${prefix}help <commandName> to view the details of that command.\n`;
      msg += `For more information, contact the owner by typing "/callad help".`;

      await message.reply(msg);

    } else if (args[0] === "-s" && args[1]) {
      const searchLetter = args[1].toLowerCase();
      let msg = `╔═══✦✧✦═══╗\n   👽 𝘼𝙣𝙘𝙝𝙚𝙨𝙩𝙤𝙧 𝘼𝙞 👽\n╚═══✦✧✦═══╝\n\n`;

      const searchResults = [];
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        if (name.startsWith(searchLetter)) {
          searchResults.push(name);
        }
      }

      if (searchResults.length > 0) {
        msg += `Found ${searchResults.length} command(s) starting with "${searchLetter.toUpperCase()}":\n`;
        msg += searchResults.sort().join(" ✧ ");
      } else {
        msg += `No commands found starting with "${searchLetter.toUpperCase()}".`;
      }

      await message.reply(msg);

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        await message.reply(`Command "${commandName}" not found.`);
      } else {
        const configCommand = command.config;
        const roleText = roleTextToString(configCommand.role);
        const author = configCommand.author || "Unknown";

        const longDescription = configCommand.longDescription
          ? configCommand.longDescription.en || "No description"
          : "No description";

        const guideBody = configCommand.guide?.en || "No guide available.";
        const usage = guideBody.replace(/{p}/g, prefix).replace(/{n}/g, configCommand.name);

        const response = `╭── NAME ───⭓
  │ ${configCommand.name}
  ├── INFO
  │ Description: ${longDescription}
  │ Other names: ${configCommand.aliases ? configCommand.aliases.join(", ") : "Do not have"}
  │ Version: ${configCommand.version || "1.0"}
  │ Role: ${roleText}
  │ Time per command: ${configCommand.countDown || 1}s
  │ Author: ${author}
  ├── Usage
  │ ${usage}
  ├── Notes
  │ The content inside <XXXXX> can be changed
  │ The content inside [a|b|c] is a or b or c
  ╰━━━━━━━❖`;

        await message.reply(response);
      }
    }
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0:
      return "0 (All users)";
    case 1:
      return "1 (Group administrators)";
    case 2:
      return "2 (Admin bot)";
    default:
      return "Unknown role";
  }
      }
