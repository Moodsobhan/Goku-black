const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const AUTHORIZED_USER_ID = "100072881080249"; // Mahi--'s user ID

async function generateImage(api, event, args, message) {
    if (event.senderID !== AUTHORIZED_USER_ID) {
        return message.reply("তোর মা রে কি মাহী ভাই চুদতো যে তুই নির্লজ্জ এর মত কমান্ড ইউজ করার জন্যে এসেছিস ?");
    }

    try {
        if (args.length === 0) {
            return message.reply("Please provide a prompt for the image.");
        }

        const prompt = args.join(" ");
        const apiKey = "hopeless"; // Your API key
        const apiUrl = `https://hopelessflux.onrender.com/api/flux?prompt=${encodeURIComponent(prompt)}&apikey=${apiKey}`;

        // Send loading message with emoji
        const loadingMessage = await message.reply(`🐊 Generating image for the prompt: "${prompt}"`);

        // Fetch the image from the API
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        if (response.status !== 200) {
            return api.sendMessage("Failed to generate the image.", event.threadID, event.messageID);
        }

        // Save the image to a file
        const imagePath = path.join(__dirname, "cache", "generated_image.png");
        fs.writeFileSync(imagePath, response.data);

        // Send the image as a message attachment
        api.sendMessage({ body: `Here is your generated image for the prompt: "${prompt}"`, attachment: fs.createReadStream(imagePath) }, event.threadID, () => {
            // Delete the loading message after sending the final message
            api.deleteMessage(loadingMessage.messageID);
        });

    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("An error occurred while generating the image.", event.threadID);
    }
}

module.exports = {
    config: {
        name: "mflux", 
        version: "1.0",
        author: "Mahi--",
        countDown: 5,
        role: 0,
        shortDescription: "Generate an image based on a prompt",
        longDescription: "Generates an image using the HopelessFlux API based on the provided prompt.",
        category: "media",
        guide: "{p} mflux <prompt>"
    },
    onStart: function ({ api, event, args, message }) {
        return generateImage(api, event, args, message);
    }
};
