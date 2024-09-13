const axios = require('axios');

// Create an object to keep track of which video has been sent for each user
const videoIndexTracker = {};

module.exports = {
  config: {
    name: "adinfo",
    aliases: [],
    author: "Mahi--",
    version: "1.3",
    cooldowns: 0,
    role: 1,  // Admin role to ensure this feature is active at all times
    shortDescription: "Monitors if specific users are added to the group.",
    longDescription: "Sends a special message and plays a video when the specified users are added to the group.",
    category: "group",
    guide: "",
  },

  onStart: async function () {
    return;
  },

  onEvent: async function ({ event, api }) {
    // Check if the event is 'log:subscribe', indicating someone was added to the group
    if (event.logMessageType === 'log:subscribe') {
      const addedUserIDs = event.logMessageData.addedParticipants.map(participant => participant.userFbId);

      // Specific user IDs to check
      const targetUserIDs = ["100072881080249", "100094357823033"];

      // Only send a message if one of the specific users was added
      const addedTargetUser = targetUserIDs.find(userID => addedUserIDs.includes(userID));
      
      if (addedTargetUser) {
        // Initialize or get the current index for the video for the added user
        if (!videoIndexTracker[addedTargetUser]) {
          videoIndexTracker[addedTargetUser] = 0; // Start with the first video
        }

        // URLs for the videos
        const videoURLs = [
          "https://i.imgur.com/dDxqgzq.mp4",
          "https://i.imgur.com/UoTpP5z.mp4"
        ];

        // Determine which video to send based on the current index
        const videoToSend = videoURLs[videoIndexTracker[addedTargetUser]];

        // Increment the index for the next time
        videoIndexTracker[addedTargetUser] = (videoIndexTracker[addedTargetUser] + 1) % videoURLs.length;

        // Message to send
        const message = "Thanks for adding my lord Mahi!";

        // Fetch the video and send it along with the message
        try {
          const response = await axios({
            method: 'get',
            url: videoToSend,
            responseType: 'stream'
          });

          // Send the message with the video attachment
          api.sendMessage({ body: message, attachment: response.data }, event.threadID);
        } catch (error) {
          api.sendMessage("Error fetching the video", event.threadID);
        }
      }
    }
  },
};
