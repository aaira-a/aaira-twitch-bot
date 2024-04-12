import { RefreshingAuthProvider } from '@twurple/auth';

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FOLDER_NAME = 'data';
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

client.on('message', (channel, tags, message, self) => {
  // Ignore echoed messages.
  if(self) return;

  if(message.toLowerCase().includes('!heya')) {
      client.say(channel, `@${tags.username}, heya!`);
  }

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
