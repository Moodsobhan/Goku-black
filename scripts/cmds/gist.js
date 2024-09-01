const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "gist",
        version: "2.0",
        author: "Rafi",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Uploads text or files to a GitHub Gist and sends the raw link."
        },
        longDescription: {
            en: "This command uploads text or files to a GitHub Gist and sends the raw link of the uploaded file."
        },
        category: "Tools",
        guide: {
            en: "To use this command, type !gist <text> or !gist <filename>. If a filename is provided, the file must be located in the 'cmds' folder."
        }
    },

    onStart: async function ({ api, args, event, message }) {
        if (args.length === 0) {
            message.reply('Please provide some text or a filename to upload to GitHub Gist.', event.threadID);
            return;
        }

        const input = args[0];
        const filePathWithoutExtension = path.join(__dirname, '..', 'cmds', input);
        const filePathWithExtension = path.join(__dirname, '..', 'cmds', input + '.js');

        // Check if the input is a file that exists
        if (fs.existsSync(filePathWithoutExtension) || fs.existsSync(filePathWithExtension)) {
            const filePath = fs.existsSync(filePathWithoutExtension) ? filePathWithoutExtension : filePathWithExtension;
            
            fs.readFile(filePath, 'utf8', async (err, data) => {
                if (err) {
                    console.error('Error reading the file:', err);
                    message.reply('Failed to read the file.', event.threadID);
                    return;
                }

                const apiUrl = `https://gist-zeta.vercel.app/upload?text=${encodeURIComponent(data)}`;

                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to upload file to GitHub Gist. Status: ${response.status}`);
                    }

                    const json = await response.json();
                    const rawLink = json.rawLink;

                    message.reply(`File uploaded to GitHub Gist: ${rawLink}`, event.threadID);
                } catch (error) {
                    console.error('Error uploading file to GitHub Gist:', error);
                    message.reply('Failed to upload file to GitHub Gist.', event.threadID);
                }
            });
        } else {
            // If input is not a file, treat it as text
            const text = args.join(' ');
            const apiUrl = `https://gist-zeta.vercel.app/upload?text=${encodeURIComponent(text)}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`Failed to upload text to GitHub Gist. Status: ${response.status}`);
                }

                const json = await response.json();
                const rawLink = json.rawLink;

                message.reply(`Text uploaded to GitHub Gist: ${rawLink}`, event.threadID);
            } catch (error) {
                console.error('Error uploading text to GitHub Gist:', error);
                message.reply('Failed to upload text to GitHub Gist.', event.threadID);
            }
        }
    }
};
