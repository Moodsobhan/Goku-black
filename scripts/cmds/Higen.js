const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "higen",
    aliases: [],
    author: "Mahi--",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image based on a model and prompt.",
    longDescription: "Generates an image using the provided model and prompt.",
    category: "ai-image",
    guide: {
      en: `Enter the command with the prompt and model number to generate an image.\n\nExample: /higen cat 3\n\nAll available models:\n` +
          `1. flux\n` +
          `2. stable-diffusion\n` +
          `3. red-cinema\n` +
          `4. animagine-xl\n` +
          `5. flux-schnell\n` +
          `6. flux-koda\n` +
          `7. flux-realism-lora\n` +
          `8. stable-diffusion-xl\n` +
          `9. jbilcke-flux-dev-panorama-lora-2\n` +
          `10. nsfw-xl\n` +
          `11. dreamlike-photoreal\n` +
          `12. newrealityxl-global-nsfw\n` +
          `13. flux-80s-cyberpunk\n` +
          `14. midjourney-v6\n` +
          `15. nai-anime\n` +
          `16. openjourney\n` +
          `17. duchaiten-pony-xl\n` +
          `18. lcm-dreamshaper-v7\n` +
          `19. midjourney-mimic\n` +
          `20. cyberpunk-anime-diffusion\n` +
          `21. sdxl-turbo\n` +
          `22. flux-cinestill\n` +
          `23. stable-diffusion-2-1\n` +
          `24. flux-film-foto`
    },
  },
  onStart: async function ({ message, args, api, event }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 105, 45, 45);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    const availableModels = [
      "flux",
      "stable-diffusion",
      "red-cinema",
      "animagine-xl",
      "flux-schnell",
      "flux-koda",
      "flux-realism-lora",
      "stable-diffusion-xl",
      "jbilcke-flux-dev-panorama-lora-2",
      "nsfw-xl",
      "dreamlike-photoreal",
      "newrealityxl-global-nsfw",
      "flux-80s-cyberpunk",
      "midjourney-v6",
      "nai-anime",
      "openjourney",
      "duchaiten-pony-xl",
      "lcm-dreamshaper-v7",
      "midjourney-mimic",
      "cyberpunk-anime-diffusion",
      "sdxl-turbo",
      "flux-cinestill",
      "stable-diffusion-2-1",
      "flux-film-foto"
    ];

    if (args[0] && args[0].toLowerCase() === "models") {
      return api.sendMessage(
        `Available models are:\n${availableModels.map((model, index) => `${index + 1}. ${model}`).join("\n")}`,
        event.threadID,
        event.messageID
      );
    }

    if (args.length < 2) {
      return api.sendMessage(
        "❌ | You need to provide a prompt and a model number.\n\n" +
        `To view available models, use /higen models.`,
        event.threadID,
        event.messageID
      );
    }

    const prompt = args.slice(0, -1).join(" ");
    const modelIndex = parseInt(args[args.length - 1], 10) - 1;

    if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= availableModels.length) {
      return api.sendMessage(
        `❌ | Invalid model number. Available models are:\n${availableModels.map((model, index) => `${index + 1}. ${model}`).join("\n")}`,
        event.threadID,
        event.messageID
      );
    }

    const model = availableModels[modelIndex];

    api.sendMessage("Please wait, generating your image...", event.threadID, event.messageID);

    try {
      const apiUrl = `https://hopelessflux.onrender.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=hopeless&model=${encodeURIComponent(model)}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: "",
        attachment: stream
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred while generating the image. Please try again later.");
    }
  }
};
