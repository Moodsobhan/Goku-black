const axios = require('axios');
const fs = require('fs');

module.exports = {
 config: {
 name: "flux",
 version: "1.2",
 author: "Vincenzo || api(samir)", 
 countDown: 0,
 role: 0,
 shortDescription: {
 en: 'Generate images based on user prompts.'
 },
 longDescription: {
 en: "This command uses an external API to create images from user-provided prompts."
 },
 category: "media",
 guide: {
 en: "{p}nixi <prompt>"
 }
 },

 onStart: async function({ message, args, api, event }) {
 try {
 const prompt = args.join(" ");
 if (!prompt) {
 return message.reply("Please provide some prompts.");
 }

 // Notify the user that the process has started
 message.reply("Please wait.... ⏰");

 const startTime = new Date().getTime();

 // Updated API URL
 const baseURL = `https://samirxpikachuio.onrender.com/flux`;
 const params = {
 prompt: prompt,
 };

 const response = await axios.get(baseURL, {
 params: params,
 responseType: 'stream'
 });

 const endTime = new Date().getTime();
 const timeTaken = (endTime - startTime) / 1000;

 const fileName = 'nixi.png';
 const filePath = `/tmp/${fileName}`;
 const writerStream = fs.createWriteStream(filePath);
 response.data.pipe(writerStream);

 writerStream.on('finish', function() {
 message.reply({
 body: `Here's your generated image. Time taken: ${timeTaken} seconds.`,
 attachment: fs.createReadStream(filePath)
 });
 });

 } catch (error) {
 console.error('Error generating image:', error);
 message.reply("❌ Failed to generate your image.");
 }
 }
};
