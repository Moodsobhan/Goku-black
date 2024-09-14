const { MongoClient } = require('mongodb');
const { getStreamFromURL } = global.utils;

const uri = `${global.GoatBot.config.database.uriMongodb}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

module.exports = {
  config: {
    name: "approval",
    version: "1.2",
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

    const adminUid = "100072881080249"; // Admin's Facebook ID to auto-approve
    const groupId = event.threadID; // Group ID of the event
    const threadData = await threadsData.get(groupId);
    const groupName = threadData.threadName;
    const { getPrefix } = global.utils;
    const prefix = getPrefix(event.threadID);

    // Special threads to receive notifications (including the specialThreadId you mentioned)
    const specialThreadId = "6520463088077828"; // Add more TIDs if necessary

    // MongoDB collection to check approved threads
    const collection = db.collection('approvedThreads');

    // Check if the admin added the bot, auto-approve if yes
    if (event.logMessageType === "log:subscribe" && event.author === adminUid) {
      await collection.updateOne({ _id: groupId }, { $set: { _id: groupId, status: "approved" } }, { upsert: true });
      return message.reply(`✅ | Group ${groupName} has been automatically approved since the bot was added by the admin.`);
    }

    // Check if the group is already approved
    const isApproved = await collection.findOne({ _id: groupId });

    // If not approved and the bot is added, notify and start approval process
    if (!isApproved && event.logMessageType === "log:subscribe") {
      try {
        // Send warning message to the group
        await message.send({
          body: `❎ | You Added The Anchestor Without Permission !!\n\n✧ Take Permission From Anchestor's Admin to Use Anchestor In Your Group !!\n✧ Join Anchestor Support Group Chat to Contact Admins !!\n\n✧ Type ${prefix}supportgc within 20 seconds.\n\n- Anchestor Co., Ltd.`,
          attachment: await getStreamFromURL("https://i.imgur.com/p62wheh.gif") // Updated image URL
        });

        // Delay for 20 seconds before notifying the admin and attempting to remove the bot
        await new Promise((resolve) => setTimeout(resolve, 20000));

        // Check again if the group has been approved in the meantime
        const approvalStatusAfterDelay = await collection.findOne({ _id: groupId });

        if (!approvalStatusAfterDelay) {
          // Notify the admin (UID)
          await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣️ | Event: Group requires approval.`, adminUid);

          // Send notification to the special thread
          await api.sendMessage(`====== Approval Required ======\n\n🍁 | Group: ${groupName}\n🆔 | TID: ${groupId}\n☣️ | Event: Group requires approval.`, specialThreadId);

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
  }
};
