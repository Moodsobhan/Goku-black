const axios = require("axios");
const { getStreamFromURL } = global.utils;

async function getStreamAndSize(url, path = "") {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    headers: {
      Range: "bytes=0-",
    },
  });
  if (path) response.data.path = path;
  const totalLength = response.headers["content-length"];
  const contentDisposition = response.headers["content-disposition"];
  let match = contentDisposition.match(/filename\*\=UTF-8''(.+)/);

  let title;
  if (match && match[1]) {
    title = decodeURIComponent(match[1]);
  } else {
    match = contentDisposition.match(/filename="(.+?)"/);
    title = match ? match[1] : "Unknown";
  }

  return {
    title,
    stream: response.data,
    size: totalLength,
  };
}

module.exports = {
  config: {
    name: "ytb",
    version: "2.0",
    author: "Mahi--",
    countDown: 3,
    role: 0,
    description: {
      en: "Download videos or audio from YouTube with enhanced limits.",
    },
    category: "media",
    guide: {
      en:
        "   {pn} [video|-v] [<name>|<link>]: Use to download a video from YouTube." +
        "\n   {pn} [audio|-a] [<name>|<link>]: Use to download audio from YouTube" +
        "\n   Example:" +
        "\n    {pn} -v Lost Stars" +
        "\n    {pn} -a Lost Stars",
    },
  },

  langs: {
    en: {
      error: "Oops, something went wrong: %1 😢",
      noResult: "Hmm, couldn’t find any results matching %1",
      choose: "👀 I've found some options for you: %1\nReply with the number or type 'cancel' to stop.",
      video: "video",
      audio: "audio",
      downloading: '🚀 Getting "%2" ready for you. Hold tight!',
      noVideo: "😔 Sorry, couldn’t find a video under 150MB for you.",
      noAudio: "😔 Sorry, couldn’t find an audio under 50MB for you.",
      info: "🎬 Title: %1\n🎥 Channel: %2\n🧑‍🤝‍🧑 Subscriber: %3\n⏳ Duration: %4\n👁 View count: %5\n👍 Likes: %6\n📅 Uploaded on: %7\n🔗 Link: %8",
    },
  },

  onStart: async function ({ args, message, event, commandName, getLang }) {
    let type;
    switch (args[0]) {
      case "-v":
      case "video":
        type = "video";
        break;
      case "-a":
      case "audio":
        type = "audio";
        break;
      default:
        return message.SyntaxError();
    }

    const youtubeLinkRegex =
      /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const isYouTubeURL = youtubeLinkRegex.test(args[1]);

    if (isYouTubeURL) {
      handleDownload({ type, url: args[1], message, event, getLang });
      return;
    }

    let searchTerm = args.slice(1).join(" ");
    searchTerm = searchTerm.includes("?feature=share")
      ? searchTerm.replace("?feature=share", "")
      : searchTerm;
    const maxResults = 6;

    let searchResults;
    try {
      searchResults = (await searchYouTube(searchTerm)).slice(0, maxResults);
    } catch (err) {
      return message.reply(getLang("error", err.message));
    }
    if (searchResults.length === 0) return message.reply(getLang("noResult", searchTerm));
    let msg = "";
    let i = 1;
    const thumbnails = [];

    for (const result of searchResults) {
      thumbnails.push(getStreamFromURL(result.thumbnail));
      msg += `${i++}. ${result.title}\nDuration: ${result.time}\nChannel: ${result.channel.name}\n\n`;
    }

    message.reply(
      {
        body: getLang("choose", msg),
        attachment: await Promise.all(thumbnails),
      },
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          searchResults,
          type,
        });
      }
    );
  },

  onReply: async ({ event, api, Reply, message, getLang }) => {
    const { searchResults, type } = Reply;
    const userChoice = event.body;
    if (!isNaN(userChoice) && userChoice <= 6) {
      const selectedResult = searchResults[userChoice - 1];
      const videoURL = `https://www.youtube.com/watch?v=${selectedResult.id}`;
      api.unsendMessage(Reply.messageID);
      await handleDownload({ type, url: videoURL, api, message, getLang });
    } else api.unsendMessage(Reply.messageID);
  },
};

async function handleDownload({ type, url, api, message, getLang }) {
  try {
    const msgSend = message.reply("⏳ Processing your request...");
    const cobaltResponse = await axios.post(
      "https://api.cobalt.tools/api/json",
      {
        url: url,
        vCodec: "h264",
        vQuality: "1080", // Improved video quality to 1080p
        aFormat: "mp3",
        filenamePattern: "enhanced",
        isAudioOnly: type === "audio",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (cobaltResponse.data.status !== "stream") {
      return await api.editMessage(
        getLang(
          "error",
          "Cobalt API returned an unexpected status.",
          msgSend.messageID
        )
      );
    }

    const streamUrl = cobaltResponse.data.url;
    const { title, stream, size } = await getStreamAndSize(streamUrl);
    const MAX_SIZE = type === "video" ? 150 * 1024 * 1024 : 50 * 1024 * 1024; // Increased limits for both video and audio
    if (size > MAX_SIZE) {
      return await api.editMessage(
        getLang(type === "video" ? "noVideo" : "noAudio"),
        msgSend.messageID
      );
    }

    message.reply(
      {
        body: `Here is your ${type === "video" ? "video" : "audio"}: ${title}`,
        attachment: await getStreamFromURL(
          streamUrl,
          `ytb_stream_${type}.${type === "video" ? "mp4" : "mp3"}`
        ),
      },
      async (err) => {
        if (err) return message.reply(getLang("error", err.message));
        message.unsend(msgSend.messageID);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    message.unsend(msgSend.messageID);
    return message.reply(getLang("error", error.message));
  }
}

async function searchYouTube(keyword) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
    const res = await axios.get(url);
    const parsedJson = JSON.parse(
      res.data.split("ytInitialData = ")[1].split(";</script>")[0]
    );
    const videos =
      parsedJson.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents[0].itemSectionRenderer.contents;
    const results = [];
    for (const video of videos)
      if (video.videoRenderer?.lengthText?.simpleText)
        results.push({
          id: video.videoRenderer.videoId,
          title: video.videoRenderer.title.runs[0].text,
          thumbnail: video.videoRenderer.thumbnail.thumbnails.pop().url,
          time: video.videoRenderer.lengthText.simpleText,
          channel: {
            id: video.videoRenderer.ownerText.runs[0].navigationEndpoint
              .browseEndpoint.browseId,
            name: video.videoRenderer.ownerText.runs[0].text,
            thumbnail:
              video.videoRenderer.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails
                .pop()
                .url.replace(/s[0-9]+\-c/g, "-c"),
          },
        });
    return results;
  } catch (e) {
    const error = new Error("Cannot search video");
    error.code = "SEARCH_VIDEO_ERROR";
    throw error;
  }
  }
