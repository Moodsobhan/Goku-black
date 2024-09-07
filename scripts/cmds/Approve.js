const { MongoClient } = require('mongodb');

const uri = `${global.GoatBot.config.database.uriMongodb}`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

module.exports = {
  config: {
    name: "approve",
    version: "1.0",
    role: "2",
    author: "Rafi",
    cooldown: "5",
    longDescription: {
      en: "Group Approve and Disapprove Command"
    },
    category: "Developer",
    guide: {
      en: "{pn} (add/remove) [thread ID]"
    }
  },

  onStart: async function ({ api, message, event, args, threadsData }) {
    try {
      if (!db) {
        return message.reply("Database not connected.");
      }

      const collection = db.collection('approvedThreads');

      if (args.length < 1) {
        message.reply("You must provide an action: !approve (add/remove) [thread ID]");
        return;
      }

      const action = args[0];
      const threadId = args[1];
      const threadData = await threadsData.get(threadId);
      const threadName = threadData.threadName;

      if (action === "add") {
        const existingThread = await collection.findOne({ _id: threadId });
        if (!existingThread) {
          await collection.insertOne({ _id: threadId, threadName, status: "approved" });
          message.reply(`🍁 | Group: ${threadName}\n🆔 | TID: ${threadId}\n✅ | Status: Approved!`);
        } else {
          message.reply(`🍁 | Group: ${threadName}\n🆔 | TID: ${threadId}\n✅ | Status: Already Approved!`);
        }
      } else if (action === "remove") {
        await collection.updateOne({ _id: threadId }, { $set: { status: "disapproved" } });
        message.reply(`🍁 | Group: ${threadName}\n🆔 | TID: ${threadId}\n❎ | Status: Disapproved!`);
      }
    } catch (err) {
      console.error("Error in onStart function:", err);
      message.reply("An error occurred while processing your request.");
    }
  },

  onChat: async function () {
    try {
      if (!db) {
        await client.connect();
        db = client.db('Approve'); // Store the database reference
        console.log("Connected to MongoDB successfully.");
      }


    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
    }
  }
};
