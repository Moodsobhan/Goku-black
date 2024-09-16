const { MongoClient } = require('mongodb');
const { getStreamFromURL } = global.utils;

const uri = `${global.GoatBot.config.database.uriMongodb}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

module.exports = {
  config: {
    name: "approval",
    version: "1.3", // Updated version
    author: "Mahi--",
    category: "events"
  },

  onStart: async function ({ api, event, threadsData, message }) {
    // Connect to MongoDB if not already connected
    if (!db) {
      try {
        await client.connect();
        db = client.db('Approve');
        console.log("Connected to MongoDB successfully.");
      } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        return message.reply("Database connection failed.");
      }
    }

    const adminUid = "100072881080249"; // Admin's Facebook ID
    const groupId = event.threadID; // Group ID of the event
    const threadData = await threadsData.get(groupId);
    const groupName = threadData.threadName;
    const { getPrefix } = global.utils;
    const prefix = getPrefix(event.threadID);

    // Special threads to receive notifications
    const specialThreadId = "6520463088077828"; 

    // MongoDB collection to check approved threads
    const collection = db.collection('approvedThreads');

    // Check if the group is already approved
    const isApproved = await collection.findOne({ _id: groupId });

    // Check if the event is the bot being added (log:subscribe is triggered for both bot and user additions)
    if (event.logMessageType === "log:subscribe") {
      const addedUserIds = event.logMessageData.addedParticipants.map(p => p.userFbId);

      // Check if the bot was added (getCurrentUserID() checks the bot's ID)
      if (addedUserIds.includes(api.getCurrentUserID())) {
        // If the bot is added to an unapproved group, initiate approval process
        if (!isApproved) {
          try {
            // Send warning message to the group
            await message.send({
              body: `❎ | You Added The Anchestor Without Permission !!\n\n✧ Take Permission From Anchestor's Admin to Use Anchestor In Your Group !!\n✧ Join Anchestor Support Group Chat to Contact Admins !!\n\n✧ Type ${prefix}supportgc within 20 seconds.\n\n- Anchestor Co., Ltd.`,
              attachment: await getStreamFromURL("https://i.imgur.com/p62wheh.gif")
            });

            // Delay for 20 seconds before notifying the admin and attempting to remove the bot
            await new Promise((resolve) => setTimeout(resolve, 20000));

            // Check again if the group has been approved in the meantime
            const approvalStatusAfterDelay = await collection.findOne({ _id: groupId });

            if (!approvalStatusAfterDelay) {
              // Notify the admin (UID)
              await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣ | Event: Group requires approval.`, adminUid);

              // Send notification to the special thread
              await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣ | Event: Group requires approval.`, specialThreadId);

              // Attempt to remove the bot from the group
              console.log(`Attempting to remove bot from group: ${groupId}`);
              await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
            } else {
              console.log(`Group ${groupId} approved during the delay period. No action required.`);
            }
          } catch (err) {
            console.error("Error during approval process:", err);
            await message.reply("An error occurred while processing your request.");
          }
        }
      } else {
        // A user (not the bot) was added, but no approval process is needed in this case
        console.log(`User ${addedUserIds} was added to group ${groupId}. No approval needed.`);
      }
    }
  }
};
