const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL, shortenURL, randomString } = global.utils;

// Temporary mail command
async function generateTempMail() {
  try {
    const res = await axios.get(`https://temp-mail-eight.vercel.app/tempmail/gen`);
    return res.data.email;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate temporary email");
  }
}

async function fetchTempMailMessages(email) {
  try {
    const res = await axios.get(`https://temp-mail-eight.vercel.app/tempmail/message?email=${encodeURIComponent(email)}`);
    return res.data.messages;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch messages");
  }
}

// Video command
const API_KEYS = [
    'b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b',
    '719775e815msh65471c929a0203bp10fe44jsndcb70c04bc42',
    'a2743acb5amsh6ac9c5c61aada87p156ebcjsnd25f1ef87037',
    '8e938a48bdmshcf5ccdacbd62b60p1bffa7jsn23b2515c852d',
    'f9649271b8mshae610e65f24780cp1fff43jsn808620779631',
    '8e906ff706msh33ffb3d489a561ap108b70jsne55d8d497698',
    '4bd76967f9msh2ba46c8cf871b4ep1eab38jsn19c9067a90bb',
];

async function video(api, event, args, message) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);
    try {
        let title = '';
        let shortUrl = '';
        let videoId = '';

        const extractShortUrl = async () => {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type === "video" || attachment.type === "audio") {
                return attachment.url;
            } else {
                throw new Error("Invalid attachment type.");
            }
        };

        const getRandomApiKey = () => {
            const randomIndex = Math.floor(Math.random() * API_KEYS.length);
            return API_KEYS[randomIndex];
        };

        if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
            shortUrl = await extractShortUrl();
            const musicRecognitionResponse = await axios.get(`https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(shortUrl)}`);
            title = musicRecognitionResponse.data.title;
            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (searchResponse.data.length > 0) {
                videoId = searchResponse.data[0].videoId;
            }

            shortUrl = await shortenURL(shortUrl);
        } else if (args.length === 0) {
            message.reply("Please provide a video name or reply to a video or audio attachment.");
            return;
        } else {
            title = args.join(" ");
            const searchResponse = await axios.get(`https://youtube-kshitiz-gamma.vercel.app/yt?search=${encodeURIComponent(title)}`);
            if (searchResponse.data.length > 0) {
                videoId = searchResponse.data[0].videoId;
            }

            const videoUrlResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
            if (videoUrlResponse.data.length > 0) {
                shortUrl = await shortenURL(videoUrlResponse.data[0]);
            }
        }

        if (!videoId) {
            message.reply("No video found for the given query.");
            return;
        }

        const downloadResponse = await axios.get(`https://yt-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}&apikey=${getRandomApiKey()}`);
        const videoUrl = downloadResponse.data[0];

        if (!videoUrl) {
            message.reply("Failed to retrieve download link for the video.");
            return;
        }

        const writer = fs.createWriteStream(path.join(__dirname, "cache", `${videoId}.mp4`));
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(path.join(__dirname, "cache", `${videoId}.mp4`));
            message.reply({ body: `📹 Playing: ${title}`, attachment: videoStream });
            api.setMessageReaction("✅", event.messageID, () => {}, true);
        });

        writer.on('error', (error) => {
            console.error("Error:", error);
            message.reply("Error downloading the video.");
        });
    } catch (error) {
        console.error("Error:", error);
        message.reply("An error occurred.");
    }
}

// Image generation command
async function generateImage(prompt) {
  try {
    const mrgenApiUrl = `https://hopelessmahi.onrender.com/api/image?prompt=${encodeURIComponent(prompt)}`;
    const mrgenResponse = await axios.get(mrgenApiUrl, { responseType: "arraybuffer" });

    const cacheFolderPath = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheFolderPath)) {
      fs.mkdirSync(cacheFolderPath);
    }
    const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
    fs.writeFileSync(imagePath, Buffer.from(mrgenResponse.data, "binary"));

    return imagePath;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to generate image");
  }
}

// GPT command
async function generateGptResponse(prompt) {
  try {
    const stoicGptApiUrl = `https://www.samirxpikachu.run.place/stoicgpt?query=${encodeURIComponent(prompt)}`;
    const stoicGptResponse = await axios.get(stoicGptApiUrl);
    return stoicGptResponse.data;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to get GPT response");
  }
}

module.exports = {
  config: {
    name: "anchestor",
    aliases: ["ai", "bot"],
    author: "Mahi--",
    version: "1.0",
    cooldowns: 10,
    role: 0,
    shortDescription: "Perform various tasks like temp mail generation, image and video handling, and GPT responses.",
    longDescription: "Handles multiple functions like generating temporary mail, images, sending videos, and getting GPT responses.",
    category: "utility",
    guide: "/ai video [query] /ai tempmail gen /ai gpt [prompt] /ai gen [prompt]"
  },
  onStart: async function ({ api, event, args, message }) {
    const subCommand = args[0];
    const commandArgs = args.slice(1).join(" ");
    
    switch (subCommand) {
      case "video":
        return video(api, event, args.slice(1), message);
        
      case "tempmail":
        if (commandArgs === "gen") {
          try {
            const tempEmail = await generateTempMail();
            api.sendMessage({ body: `${tempEmail}` }, event.threadID, event.messageID);
          } catch (err) {
            api.sendMessage({ body: "Sorry, an error occurred while generating the temporary email." }, event.threadID, event.messageID);
          }
        } else {
          try {
            const messages = await fetchTempMailMessages(commandArgs);

            if (messages && messages.length > 0) {
              const subjects = messages.map((msg) => `From: ${msg.sender}\nSubject: ${msg.subject}`).join("\n\n");
              api.sendMessage({ body: `Messages for ${commandArgs}:\n\n${subjects}` }, event.threadID, event.messageID);
            } else {
              api.sendMessage({ body: `No messages found for the email: ${commandArgs}` }, event.threadID, event.messageID);
            }
          } catch (err) {
            api.sendMessage({ body: `Error: ${err.message}` }, event.threadID, event.messageID);
          }
        }
        break;
        
      case "gen":
        try {
          const imagePath = await generateImage(commandArgs);
          const stream = fs.createReadStream(imagePath);
          message.reply({
            body: "",
            attachment: stream
          });
        } catch (err) {
          message.reply("❌ | An error occurred while generating the image.");
        }
        break;
        
      case "gpt":
        try {
          const gptResponse = await generateGptResponse(commandArgs);
          api.sendMessage(gptResponse, event.threadID, event.messageID);
        } catch (err) {
          api.sendMessage("❌ | An error occurred while getting the GPT response.", event.threadID, event.messageID);
        }
        break;

      default:
  api.sendMessage(
    `Prompt Instructions to get a Specific Response\n\n` +
    `╭───Media\n` +
    `│1. {p}ancestor video [query] - To handle videos\n` +
    `│2. {p}ancestor tempmail gen - To generate a temporary email\n` +
    `│3. {p}ancestor tempmail [email] - To fetch messages from a temporary email\n` +
    `│4. {p}ancestor gen [prompt] - To generate an image based on a prompt\n` +
    `│5. {p}ancestor gpt [prompt] - To get a GPT response\n` +
    `╰─────────────🏵\n\n` +
    `example: {p}ancestor video cool song\n\n` +
    `I'll add more soon. This is beta only.`,
    event.threadID,
    event.messageID
  );
    }
  }
};
