const axios = require('axios');

module.exports = {
  config: {
    name: "adinfo",
    aliases: [],
    author: "Mahi--",
    version: "1.1",
    cooldowns: 0,
    role: 1,  // Admin role to ensure this feature is active at all times
    shortDescription: "Monitors if a specific user is added to the group.",
    longDescription: "Sends a special message and plays an audio when the specified user is added to the group.",
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

      // The specific user ID to check
      const myLordID = "100072881080249";

      // Only send a message if the specific user was added
      if (addedUserIDs.includes(myLordID)) {
        // Message to send
        const message = "Thanks for adding my lord Mahi!";

        // The URL for the audio clip
        const audioURL = "https://cdn.fbsbx.com/v/t59.3654-21/427957085_1420463825221848_7894718088507859777_n.mp4/audioclip-1725567411000-68544.mp4?_nc_cat=110&ccb=1-7&_nc_sid=d61c36&_nc_eui2=AeEE_WyBNWh0nvxM5Vvx_8pav9jhdPG_UgK_2OF08b9SAhroxEVnEBRJ0fon8K1xHKDB_2G3yAkW1tyzxpZ7tZvE&_nc_ohc=J530T78qARwQ7kNvgGDZQPA&_nc_ht=cdn.fbsbx.com&oh=03_Q7cD1QE5Bo7QEX_bXx0OaCGREXdB-vbRYPObc-45Q5WvdIiMhA&oe=66DC03D6&dl=1";

        // Fetch the audio and send it along with the message
        try {
          const response = await axios({
            method: 'get',
            url: audioURL,
            responseType: 'stream'
          });
          api.sendMessage({ body: message, attachment: response.data }, event.threadID);
        } catch (error) {
          api.sendMessage("Error fetching the audio", event.threadID);
        }
      }
    }
  },
};
