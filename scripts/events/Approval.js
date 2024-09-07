const { MongoClient } = require('mongodb');
const { getStreamFromURL } = global.utils;

const uri = `${global.GoatBot.config.database.uriMongodb}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

module.exports = {
  config: {
    name: "approval",
    version: "1.0",
    author: "rehat--",
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

    const uid = "100072881080249"; // The admin's Facebook ID to notify
    const groupId = event.threadID;
    const threadData = await threadsData.get(groupId);
    const name = threadData.threadName;
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);

    // List of specific thread IDs to always send approval notifications for
    const specialThreadIds = ["7750432038384460", "6520463088077828"];

    // Check if the group is in the approved threads collection or is in the special thread IDs list
    const collection = db.collection('approvedThreads');
    const isApproved = await collection.findOne({ _id: groupId });

    if (!isApproved && !specialThreadIds.includes(groupId) && event.logMessageType === "log:subscribe") {
      // Send warning message to the group
      await message.send({
        body: `❎ | You Added The Anchestor Without Permission !!\n\n✧Take Permission From Anchestors Admin's to Use Anchestor In Your Group !!\n✧Join Anchestor Support GC to Contact With Admin's !!\n\n✧Type ${p}supportgc within 20 seconds.\n\n- Anchestor Co., Ltd.`,
        attachment: await getStreamFromURL("https://i.postimg.cc/rsVb8Ty4/4b8d6edb-d2aa-4ce1-aca5-4f90f7b5798a-1.png")
      });

      // Delay for 20 seconds before notifying the admin
      await new Promise((resolve) => setTimeout(resolve, 20000));

      // Notify the admin and remove the bot from the group
      await api.sendMessage(
        `====== Approval ======\n\n🍁 | Group:- ${name}\n🆔 | TID:- ${groupId}\n☣️ | Event:- The Group Needs Approval`,
        uid,
        async () => {
          await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
        }
      );
    }
  }
};
