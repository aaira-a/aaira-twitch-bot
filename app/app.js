const express = require("express");
const axios = require("axios");

const fs = require("fs");
const path = require("path");
const util = require("util");
const humanizeDuration = require("humanize-duration");

const app = express();


const DATA_FOLDER_NAME = 'data';
const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'data.json');
const credFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'credentials.json');

app.get("/bot/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});

app.get("/bot/toggle", (req, res) => {
  let response = {"status": "undefined"};

  if (fs.existsSync(dataFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    if (fileContent.hasOwnProperty("bot_enabled")) {
      if (fileContent["bot_enabled"] == true) {
        response["status"] = "enabled";
      }
      else if (fileContent["bot_enabled"] == false ) {
        response["status"] = "disabled";
      }
    }
    else {
      response["status"] = "disabled";
    }
  }
  else {
    response["status"] = "disabled";
  }

  res.status(200).json(response);

});

app.get("/bot/set/toggle/:state?", (req, res) => {
  const validStates = ["enable", "disable"];

  let response = {"bot_enabled": undefined};

  if (req.params.state == "enable") {
    if (fs.existsSync(dataFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      fileContent["bot_enabled"] = true;
      fs.writeFileSync(dataFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(dataFilePath, JSON.stringify({"bot_enabled": true}));
    }
    response["bot_enabled"] = true;
    res.status(200).json(response);
  }

  if (req.params.state == "disable") {
    if (fs.existsSync(dataFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      fileContent["bot_enabled"] = false;
      fs.writeFileSync(dataFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(dataFilePath, JSON.stringify({"bot_enabled": false}));
    }
    response["bot_enabled"] = false;
    res.status(200).json(response);
  }

  res.status(400).send();
});


app.get("/bot/now-playing", async (req, res) => {
  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(dataFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }

    const currentTimestamp = Date.now();

    // checks if stored data age is less than 15 seconds
    // and serves the value from the data file
    if (currentTimestamp - fileContent["timestamp"] < 15000) {
      response["artistName"] = fileContent["artistName"];
      response["itemName"] = fileContent["itemName"];
      response["timestamp"] = fileContent["timestamp"];
      response["songLink"] = fileContent["songLink"];
      response["duration_ms"] = fileContent["duration_ms"];
      return formatOutput(res, 200, response, req.query.format);
    }

    // retrieves data from Spotify API because the data file is stale
    else {
      await nowPlayingMainLogic(req, res);
    }

  }

  else {
    await nowPlayingMainLogic(req, res);

  }

});

app.get("/bot/now-playing-link", (req, res) => {

  if (fs.existsSync(dataFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (fileContent.hasOwnProperty("songLink")) {
      songLink = fileContent["songLink"];

      let formattedText = `Song link: ${songLink}`;

      res.set("Content-Type", "text/plain");
      return res.status(200).send(formattedText);
    }

    else {
      res.set("Content-Type", "text/plain");
      return res.status(404).send("No song link exists in data file");
    }

  }

});


async function nowPlayingMainLogic (req, res) {
  const callSpotifyResult = await callSpotifyCurrentlyPlaying();
  if (callSpotifyResult.status == "Unauthorized") {

    const tokenRefreshResult = await callSpotifyTokenRefresh();
    if (tokenRefreshResult.status == "Failed") {
      return res.status(400).json({"error": "Unable to refresh token"});
    }

    const callSpotifyResult3 = await callSpotifyCurrentlyPlaying();
      if (callSpotifyResult3.status != "Succesful") {

        return res.status(503).json(
          {"error": "Unable to request currently playing song after second attempt"});
      }
      else {
       return formatOutput(res, 200, callSpotifyResult3.data, req.query.format);
      }

  }
  else {
    return formatOutput(res, 200, callSpotifyResult.data, req.query.format);
  }
};

function formatOutput(res, code, data, format) {

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

  if (format == "text") {

    const formattedDuration =  shortEnglishHumanizer(data.duration_ms);
    const formattedText = `Now playing: [${data.artistName}] - [${data.itemName}] - [${formattedDuration}]`;
    
    res.set("Content-Type", "text/plain");
    return res.status(code).send(formattedText);
  }
  else {
    return res.status(code).json(data);
  }
}

async function callSpotifyCurrentlyPlaying() {
  const credFileContent = JSON.parse(fs.readFileSync(credFilePath, 'utf8'));
  
  axios.interceptors.response.use((response) => {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response;
    }, (error) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      if (error.response.status == 401) {
        return Promise.resolve(error);
      }
      return Promise.reject(error);
    });

  let functionResponse = {"status": "Unresolved"};

  return axios({
    method: 'get',
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: {'Authorization': `Bearer ${credFileContent["SPOTIFY_ACCESS_TOKEN"]}`}
  })
    .then(function (response) {
      if (response.hasOwnProperty('response')) {
        if (response.response.status == 401) {
          functionResponse = {"status": "Unauthorized"}
        }
      } else {
          let dataToSave = {
            "artistName": response.data.item.album.artists[0].name,
            "itemName": response.data.item.name,
            "timestamp": response.data.timestamp,
            "songLink": response.data.item.external_urls.spotify,
            "duration_ms": response.data.item.duration_ms
          };
          fs.writeFile(dataFilePath, JSON.stringify(dataToSave), (err) => {
            if (err) { console.log(err) }
          });
          functionResponse = {"status": "Succesful", "data": dataToSave}
      }
      return functionResponse;
    })
}

async function callSpotifyTokenRefresh() {
  const credFileContent = JSON.parse(fs.readFileSync(credFilePath, 'utf8'));

  const tokenRefreshParams = new URLSearchParams({
    grant_type: 'refresh_token',
    access_token: credFileContent["SPOTIFY_ACCESS_TOKEN"],
    refresh_token: credFileContent["SPOTIFY_REFRESH_TOKEN"]
  });

  const base64Header = Buffer.from(
    `${credFileContent["SPOTIFY_CLIENT_ID"]}:${credFileContent["SPOTIFY_CLIENT_SECRET"]}`
    ).toString('base64');

  let functionResponse = {"status": "Unresolved"};

  return axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${base64Header}`
    },
    params: tokenRefreshParams
  })
  .then(function (response) {
    credFileContent["SPOTIFY_ACCESS_TOKEN"] = response.data.access_token;
    fs.writeFileSync(credFilePath, JSON.stringify(credFileContent));
    functionResponse = {"status": "Succesful"}
    return functionResponse;
  })
  .catch((error) => {
    if (error) { console.log(error) }
    functionResponse = {"status": "Failed", "error": error}
    return functionResponse;
  })
}


module.exports = app;
