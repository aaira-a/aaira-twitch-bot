import { RefreshingAuthProvider } from '@twurple/auth';
import axios from 'axios';
import humanizeDuration from "humanize-duration";

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FOLDER_NAME = 'data';

const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'twitch_data.json');

const credFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'twitch_credentials.json');
const clientData = JSON.parse(await fs.readFile(credFilePath, 'utf-8'));
const clientId = clientData["TWITCH_CLIENT_ID"];
const clientSecret = clientData["TWITCH_CLIENT_SECRET"];


const tokenDataPath = path.join(__dirname, DATA_FOLDER_NAME, 'tokens.926502276.json');
const tokenData = JSON.parse(await fs.readFile(tokenDataPath, 'utf-8'));

const authProvider = new RefreshingAuthProvider(
  {
    clientId,
    clientSecret
  }
);

authProvider.onRefresh(async (userId, newTokenData) => await fs.writeFile(tokenDataPath, JSON.stringify(newTokenData, null, 4), 'utf-8'));

await authProvider.addUserForToken(tokenData, ['chat']);

import * as tmi from '@twurple/auth-tmi';

const client = new tmi.Client({
  options: { debug: true, messagesLogLevel: 'info' },
  connection: {
    reconnect: true,
    secure: true
  },
  authProvider: authProvider,
  channels: ['aaira0']
});
client.connect().catch(console.error);

client.on('message', async (channel, tags, message, self) => {
  // Ignore echoed messages.
  if(self) return;

  if(message.toLowerCase().includes('!heya')) {
      client.say(channel, `@${tags.username}, heya!`);
  }

  if(message.toLowerCase().includes('!baby')) {
      client.say(channel, `aaira0Love Hi baby @${tags.username}! aaira0Love`);
  }

  if(message.toLowerCase().includes('!lurk')) {
      client.say(channel, `Thanks for lurking @${tags.username} aaira0Pat`);
  }

  if(message.toLowerCase().includes('!tags')) {
      console.log(tags);
  }


  // if(message.toLowerCase().includes('!comp')) {
  //   console.log(channel);
  //   await emitNowPlayingTrack(client, channel);
  // }

  if(message.toLowerCase().includes('!best')) {

    const re = /!best @(\S+)/;
    const r = message.toLowerCase().match(re);

    if(r) {
      client.say(channel, `@${r[1]} YOU ARE THE BEST!`)
    }
    else {
      client.say(channel, `@${tags.username} YOU ARE THE BEST!`);
    }
  }
});


async function emitNowPlayingTrack(_client, _channel) {
  const fileContent = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));

  const previousTrackId = fileContent["trackId"];
  console.log(`previous track id: ${previousTrackId}`);

  const response = await getSpotifyData();
  const currentTrackId = response["data"]["trackId"];
  console.log(`current track id: ${currentTrackId}`);

  const formattedDuration =  shortEnglishHumanizer(response.data.duration_ms);

  if (currentTrackId != previousTrackId) {
    const formattedText = `Now playing: [${response.data.artistName}] - [${response.data.itemName}] - [${formattedDuration}]`;
    _client.say(_channel, formattedText);
  }
}


const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: "shortEn",
  delimiter: "",
  spacer: "",
  round: true,
  languages: {
    shortEn: {
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
});


async function getSpotifyData() {

  return axios({
    method: 'get',
    url: 'http://127.0.0.1:3007/bot/now-playing',
  })
    .then(function (response) {
      let dataToSave = {
        "artistName": response.data.artistName,
        "itemName": response.data.itemName,
        "upstreamTimestamp": response.data.timestamp,
        "currentTimestamp": Date.now(),
        "songLink": response.data.songLink,
        "trackId": response.data.trackId,
        "duration_ms": response.data.duration_ms
      };
      fs.writeFile(dataFilePath, JSON.stringify(dataToSave), (err) => {
        if (err) { console.log(err) }
      });
      const functionResponse = {"status": "Succesful", "data": dataToSave}
      
      return functionResponse;
    })

}

setInterval(()=> {
  console.log('Every 15 seconds');
  emitNowPlayingTrack(client, '#aaira0');
},15000)

console.log('Initialization');
