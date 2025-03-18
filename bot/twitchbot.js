import { RefreshingAuthProvider } from '@twurple/auth';
import axios from 'axios';
import humanizeDuration from "humanize-duration";
import dotenv from 'dotenv';

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FOLDER_NAME = 'data';

dotenv.config(
  {
    path: path.join(__dirname, DATA_FOLDER_NAME, '.env')
  });

const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'twitch_data.json');
const dataFileTemplatePath = path.join(__dirname, DATA_FOLDER_NAME, 'twitch_data_template.json');

const attFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'att_data.json');
const attFileTemplatePath = path.join(__dirname, DATA_FOLDER_NAME, 'att_data_template.json');

const firstFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'first_data.json');
const firstFileTemplatePath = path.join(__dirname, DATA_FOLDER_NAME, 'first_data_template.json');

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

// hadir redeems
client.on('redeem', async (channel, username, rewardType, tags, message) => {
    if (rewardType == 'b12bc6f7-c6a2-4518-8637-a5fa47a29f53') {
      console.log('rewardType: ' + rewardType);
      console.log('username: ' + username);
      console.log('message: ' + message);

      try {
        const stats = await fs.stat(attFilePath);
        
        if (stats.size == 0) {
          await fs.copyFile(attFileTemplatePath, attFilePath);
        }
      } 
      catch {
        await fs.copyFile(attFileTemplatePath, attFilePath);
      }

      // open file
      const fileContent = JSON.parse(await fs.readFile(attFilePath, 'utf-8'));

      // initialize count to 1 for new user redemption
      let count = 1;

      // check if user data exists
      if (fileContent.hasOwnProperty(username)) {
        // increment count of existing user
        count = fileContent[username] + 1;
      }

      // use user's incremented count, or the default 1
      fileContent[username] = count;

      // write to file
      fs.writeFile(attFilePath, JSON.stringify(fileContent), (err) => {
        if (err) { console.log(err) }
      });

      // output to channel
      client.say(channel, `${username} has hadir-ed ${count} times aaira0Thumbs`);
    };
});

// first redeems
client.on('redeem', async (channel, username, rewardType, tags, message) => {
    if (rewardType == 'a244ee05-9f89-4d74-b8f4-0656655a942b') {
      console.log('rewardType: ' + rewardType);
      console.log('username: ' + username);
      console.log('message: ' + message);

      try {
        const stats = await fs.stat(firstFilePath);
        
        if (stats.size == 0) {
          await fs.copyFile(firstFileTemplatePath, firstFilePath);
        }
      } 
      catch {
        await fs.copyFile(firstFileTemplatePath, firstFilePath);
      }

      // open file
      const fileContent = JSON.parse(await fs.readFile(firstFilePath, 'utf-8'));

      // initialize count to 1 for new user redemption
      let count = 1;

      // check if user data exists
      if (fileContent.hasOwnProperty(username)) {
        // increment count of existing user
        count = fileContent[username] + 1;
      }

      // use user's incremented count, or the default 1
      fileContent[username] = count;

      // write to file
      fs.writeFile(firstFilePath, JSON.stringify(fileContent), (err) => {
        if (err) { console.log(err) }
      });

      // output to channel
      client.say(channel, `${username} was the first ${count} times aaira0Thumbs`);
    };
});

client.on('message', async (channel, tags, message, self) => {
  // Ignore echoed messages.
  if(self) return;

  if(message.toLowerCase().startsWith('!heya')) {
      client.say(channel, `@${tags.username}, heya!`);
  }

  if(message.toLowerCase().startsWith('!baby')) {
      client.say(channel, `aaira0Love Hi baby @${tags.username}! aaira0Love`);
  }

  if(message.toLowerCase().startsWith('!lurk')) {
      client.say(channel, `Thanks for lurking @${tags.username} aaira0Pat`);
  }

  if(message.toLowerCase().startsWith('!tags')) {
      console.log(tags);
  }

  if(message.toLowerCase().startsWith('!hadir')) {

      const re = /!hadir @(\S+)/;
      const r = message.toLowerCase().match(re);

      let username = tags.username;

      if(r) {
        username = r[1].toLowerCase();
      }

      const fileContent = JSON.parse(await fs.readFile(attFilePath, 'utf-8'));
 
      let count = 0;

      if (fileContent.hasOwnProperty(username)) {
        count = fileContent[username];
      }

      client.say(channel, `@${username} has hadir-ed ${count} times aaira0Thumbs`);
  }

  if(message.toLowerCase().startsWith('!first')) {

      const re = /!first @(\S+)/;
      const r = message.toLowerCase().match(re);

      let username = tags.username;

      if(r) {
        username = r[1].toLowerCase();
      }

      const fileContent = JSON.parse(await fs.readFile(firstFilePath, 'utf-8'));
 
      let count = 0;

      if (fileContent.hasOwnProperty(username)) {
        count = fileContent[username];
      }

      client.say(channel, `@${username} was the first ${count} times aaira0Thumbs`);
  }

  if(message.toLowerCase().startsWith('!add')) {
    const re = /![Aa][Dd][Dd] (.+)/;
    const r = message.match(re);

    let trackData;
    let successfulText = `Added song request by @${tags.username}: `;
    let failedText = `Failed to add song request by @${tags.username}: `;
    let finalText;
    let result;


    const botToggleData = await getToggleData();

    if (botToggleData["data"]["bot_enabled"] != true) {
      finalText = failedText + ` bot is disabled`;
    }

    else if (botToggleData["data"]["request_enabled"] != true) {
      finalText = failedText + ` song request is disabled`;
    }

    else {
      const requestType = await getSongTypeRequest(r[1]);

      if (requestType.data == 'URI') {
        console.log('going through the URI path')

        result = await sendAddSongRequest(r[1]);

        if (result.code == 200) {
          trackData = await getSpotifyTrackData(result.data);
        }
      }

      if (requestType.data == 'STRING') {
        console.log('going through the STRING path')

        const searchResult = await searchSpotifySong(r[1]);
        result = await sendAddSongRequest(searchResult.data.songLink);

        if (result.code == 200) {
          trackData = await getSpotifyTrackData(result.data);
        }
        
      } 

      if (result.code == 200) {
        finalText = `${successfulText}` +
        `[${trackData.data.artistName}] - ` +
        `[${trackData.data.itemName}] - [${shortEnglishHumanizer(trackData.data.duration_ms)}]`
      }
      else {
        finalText = failedText + `${result.error}`;
      }
    }

    client.say(channel, finalText);
  } 

  if(message.toLowerCase().startsWith('!best')) {

    const re = /!best @(\S+)/;
    const r = message.toLowerCase().match(re);

    if(r) {
      client.say(channel, `@${r[1]} YOU ARE THE BEST!`)
    }
    else {
      client.say(channel, `@${tags.username} YOU ARE THE BEST!`);
    }
  }

  if(message.toLowerCase().startsWith('!deep')) {
    const re = /!deep (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askDeep(question) ;
    client.say(channel, `DeepSeek: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!qwen')) {
    const re = /!qwen (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askQwen(question) ;
    client.say(channel, `Qwen: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!perp')) {
    const re = /!perp (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askPerp(question) ;
    client.say(channel, `Perplexity.AI: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!gpt')) {
    const re = /!gpt (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askGPT(question) ;
    client.say(channel, `GPT: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!gpt2')) {
    const re = /!gpt2 (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askGPT2(question) ;
    client.say(channel, `GPT-web: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!ask')) {
    const re = /!ask (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askAI(question) ;
    client.say(channel, `AI: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!annoying')) {
    const re = /!annoying (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askAI(question, 'annoying') ;
    client.say(channel, `AI: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!kid')) {
    const re = /!kid (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askAI(question, 'kid') ;
    client.say(channel, `AI: @${tags.username} ${aiResponse}`);
  }

  if(message.toLowerCase().startsWith('!negative')) {
    const re = /!negative (.+)/;
    const r = message.match(re);
    const question = r[1];

    let aiResponse = await askAI(question, 'negative') ;
    client.say(channel, `AI: @${tags.username} ${aiResponse}`);
  }



});


async function emitNowPlayingTrack(_client, _channel) {

  try {
    const stats = await fs.stat(dataFilePath);
    
    if (stats.size == 0) {
      await fs.copyFile(dataFileTemplatePath, dataFilePath);
    }
  } 
  catch {
    await fs.copyFile(dataFileTemplatePath, dataFilePath);
  }

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


async function askAI(question, modifier) {
  const basicQuestionText = `Your response should be less than 475 characters. Please respond as concise as possible. `;
  const postQuestionText = `Question is: ${question}?`;

  const modifierMap = {
    "annoying": "Please respond in most annoying tone possible. ",
    "kid": "Your response should be understandable enough for kids around 5 years old. ",
    "negative": "Please respond in a negative or pessimist way. ",
    "default": " "
  };

 let finalQuestionText = basicQuestionText + modifierMap[modifier] + postQuestionText;

  return axios({
    method: 'post',
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      "contents": [
        {
          "parts": [
            {
              "text": finalQuestionText
            }
          ]
        }
      ]
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let candidates = response.data.candidates[0]
      if (candidates.hasOwnProperty("content")) {
        aiResponse = candidates.content.parts[0].text;
        validResponse = true;
      }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}

async function askGPT(question, modifier) {
  const basicQuestionText = `Your response should be less than 475 characters. Please respond as concise as possible. `;
  const postQuestionText = `Question is: ${question}?`;

  const modifierMap = {
    "annoying": "Please respond in most annoying tone possible. ",
    "kid": "Your response should be understandable enough for kids around 5 years old. ",
    "negative": "Please respond in a negative or pessimist way. ",
    "default": " "
  };

  // no modifier yet for GPT
  // let finalQuestionText = basicQuestionText + modifierMap[modifier] + postQuestionText;
  let finalQuestionText = basicQuestionText + modifierMap["default"] + postQuestionText;

  console.log(finalQuestionText);

  return axios({
    method: 'post',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_KEY}`
    },
    data: {
      "model": "gpt-4o-mini",
      "messages": [
        {
          "role": "user",
          "content": finalQuestionText
        }
      ],
      "temperature": 0.7
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let choice = response.data.choices[0];
      if (choice.hasOwnProperty("message") 
          && choice.message.hasOwnProperty("content"))
        {
          aiResponse = choice.message.content;
          validResponse = true;
        }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}

async function askGPT2(question, modifier) {
  const systemText = `Your response should be less than 475 characters. Please respond as concise as possible. `;

  console.log(question);

  return axios({
    method: 'post',
    url: 'https://api.openai.com/v1/responses',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_KEY}`
    },
    data: {
      "model": "gpt-4o-mini",
      "tools": [
        {
          "type": "web_search_preview"
        }
      ],
      "instructions": systemText,
      "input": question,
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let output = response.data.output;

    let filtered = output.filter(a => a.role == "assistant");

      if (filtered[0].content[0].hasOwnProperty("text"))
        {
          aiResponse = filtered[0].content[0].text;
          validResponse = true;
        }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}

async function askPerp(question, modifier) {
  const basicQuestionText = `Your response should be less than 475 characters. Please respond as concise as possible. `;
  const postQuestionText = `Question is: ${question}?`;

  const modifierMap = {
    "annoying": "Please respond in most annoying tone possible. ",
    "kid": "Your response should be understandable enough for kids around 5 years old. ",
    "negative": "Please respond in a negative or pessimist way. ",
    "default": " "
  };

  // no modifier yet for Perplexity AI
  // let finalQuestionText = basicQuestionText + modifierMap[modifier] + postQuestionText;
  let finalQuestionText = basicQuestionText + modifierMap["default"] + postQuestionText;

  console.log(finalQuestionText);

  return axios({
    method: 'post',
    url: 'https://api.perplexity.ai/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_KEY}`
    },
    data: {
      "model": "llama-3.1-sonar-small-128k-online",
      "messages": [
        {
          "role": "system",
          "content": "Be precise and concise. Limit the response to 475 characters"
        },
        {
          "role": "user",
          "content": finalQuestionText
        }
      ],
      "temperature": 0.2,
      "top_p": 0.9,
      "return_citations": true,
      "search_domain_filter": [
        "perplexity.ai"
      ],
      "return_images": false,
      "return_related_questions": false,
      "search_recency_filter": "month",
      "top_k": 0,
      "stream": false,
      "presence_penalty": 0,
      "frequency_penalty": 1
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let choice = response.data.choices[0];
      if (choice.hasOwnProperty("message") 
          && choice.message.hasOwnProperty("content"))
        {
          aiResponse = choice.message.content;
          validResponse = true;
        }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}

async function askQwen(question, modifier) {
  const basicQuestionText = `Your response should be less than 475 characters. Please respond as concise as possible. `;
  const postQuestionText = `Question is: ${question}?`;

  const modifierMap = {
    "annoying": "Please respond in most annoying tone possible. ",
    "kid": "Your response should be understandable enough for kids around 5 years old. ",
    "negative": "Please respond in a negative or pessimist way. ",
    "default": " "
  };

  // no modifier yet for Qwen
  // let finalQuestionText = basicQuestionText + modifierMap[modifier] + postQuestionText;
  let finalQuestionText = basicQuestionText + modifierMap["default"] + postQuestionText;

  console.log(finalQuestionText);

  return axios({
    method: 'post',
    url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.QWEN_KEY}`
    },
    data: {
      "model": "qwen-plus",
      "messages": [
        {
          "role": "user",
          "content": finalQuestionText
        }
      ]
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let choice = response.data.choices[0];
      if (choice.hasOwnProperty("message") 
          && choice.message.hasOwnProperty("content"))
        {
          aiResponse = choice.message.content;
          validResponse = true;
        }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}


async function askDeep(question, modifier) {
  const systemText = `Your response should be less than 475 characters. Please respond as concise as possible. `;


  console.log(question);

  return axios({
    method: 'post',
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_KEY}`
    },
    data: {
      "model": "deepseek-chat",
      "messages": [
        {
          "role": "system",
          "content": systemText
        },
        {
          "role": "user",
          "content": question
        }
      ]
    }
  }).then(function (response) {
    let validResponse = false;
    let aiResponse = '';
    let functionResponse = "Unable to get response from AI";

    let choice = response.data.choices[0];
      if (choice.hasOwnProperty("message") 
          && choice.message.hasOwnProperty("content"))
        {
          aiResponse = choice.message.content;
          validResponse = true;
        }
    
    if (validResponse == true) {
      functionResponse = aiResponse;
    }

    return functionResponse;
  })
}

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

async function getToggleData() {

  axios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response.status != 200) {
      return Promise.resolve(error);
    }    
    return Promise.reject(error);
  });

  return axios({
    method: 'get',
    url: 'http://127.0.0.1:3007/bot/toggle',
  })
    .then(function (response) {
      const functionResponse = {"status": "Succesful", "data": response.data}
      
      return functionResponse;
    })

}

async function sendAddSongRequest(input) {

  axios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response.status != 200) {
      return Promise.resolve(error);
    }    
    return Promise.reject(error);
  });

  return axios({
    method: 'post',
    url: 'http://127.0.0.1:3007/bot/add-song?song=' + input,
  })
    .then(function (response) {

      let functionResponse;

      if (response.status != 200) {
        functionResponse = {
          "status": "Failed",
          "data": "NODATA",
          "code": response.status,
          "error": response.response.data.error
        }
      }
      else {
        functionResponse = {
          "status": "Succesful",
          "data": response.data.trackId,
          "code": response.status
        }
      }
      return functionResponse;
    })

}

async function getSpotifyTrackData(input) {

  axios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response.status != 200) {
      return Promise.resolve(error);
    }    
    return Promise.reject(error);
  });


  return axios({
    method: 'get',
    url: 'http://127.0.0.1:3007/bot/get-track-data?trackId=' + input,
  })
    .then(function (response) {
      let functionResponse;

      if (response.status != 200) {
        functionResponse = {
          "status": "Failed",
          "data": "NODATA",
          "code": response.status,
          "error": response.response.data.error
        }
      }
      else {
        functionResponse = {"status": "Succesful", "data": response.data}
      }
      
      return functionResponse;
    })

}

async function getSongTypeRequest(input) {

  axios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response.status != 200) {
      return Promise.resolve(error);
    }    
    return Promise.reject(error);
  });

  return axios({
    method: 'get',
    url: 'http://127.0.0.1:3007/bot/get-request-type?query=' + input,
  })
    .then(function (response) {
      let functionResponse;
      
      if (response.status != 200) {
        functionResponse = {
          "Status": "Failed",
          "data": "NODATA",
          "code": response.status,
          "error": response.response.data.error
        }
      }
      else {
        functionResponse = {"status": "Succesful", "data": response.data}
      }

      return functionResponse;
    })

}

async function searchSpotifySong(input) {

  axios.interceptors.response.use((response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  }, (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    if (error.response.status != 200) {
      return Promise.resolve(error);
    }    
    return Promise.reject(error);
  });

  return axios({
    method: 'get',
    url: 'http://127.0.0.1:3007/bot/search-song?query=' + input,
  })
    .then(function (response) {
      let functionResponse;

      if (response.status != 200) {
        functionResponse = {
          "status": "Failed",
          "data": "NODATA",
          "code": response.status,
          "error": response.response.data.error
        }
      }
      else {
        functionResponse = {"status": "Succesful", "data": response.data}
      }
      
      return functionResponse;
    })

}


setInterval(async ()=> {
  console.log('Every 15 seconds');

  const botToggleData = await getToggleData();

  if(botToggleData["data"]["bot_enabled"] == true) {
    emitNowPlayingTrack(client, '#aaira0');
  }

},15000)

console.log('Initialization');
