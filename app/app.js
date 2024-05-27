const express = require("express");
const axios = require("axios");

const fs = require("fs");
const path = require("path");
const util = require("util");
const humanizeDuration = require("humanize-duration");

const app = express();

const utilFunctions = require("./utils");


const DATA_FOLDER_NAME = 'data';
const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'spotify_data.json');
const credFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'spotify_credentials.json');
const toggleFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'toggle_data.json');

app.get("/bot/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});

app.get("/bot/countdown", (req, res) => {
  const unit = req.query.unit;

  const theFuture = 1751299199000;
  const now = Date.now();

  const duration = (theFuture - now);

  let formattedDuration = "";

  if (unit == "full") {
    formattedDuration = humanizeDuration(duration);
  }

  else {
    formattedDuration = humanizeDuration(duration, { units: ["d", "h", "m", "s"] });
  }

  let formattedText = `Reminder: The d-day is about ${formattedDuration}`;

  res.set("Content-Type", "text/plain");
  return res.status(200).send(formattedText);  

});

app.get("/bot/toggle", (req, res) => {
  let response = {"status": "undefined"};

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));
    if (fileContent.hasOwnProperty("bot_enabled")) {
      response = fileContent;
    }
    else {
      response["bot_enabled"] = false;
    }
  }
  else {
    response["bot_enabled"] = false;
  }

  res.status(200).json(response);

});

app.get("/bot/set/toggle/:state?", (req, res) => {
  const validStates = ["enable", "disable"];

  let response = {"bot_enabled": undefined};

  if (req.params.state == "enable") {
    if (fs.existsSync(toggleFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));
      fileContent["bot_enabled"] = true;
      fs.writeFileSync(toggleFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(toggleFilePath, JSON.stringify({"bot_enabled": true}));
    }
    response["bot_enabled"] = true;
    res.status(200).json(response);
  }

  if (req.params.state == "disable") {
    if (fs.existsSync(toggleFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));
      fileContent["bot_enabled"] = false;
      fs.writeFileSync(toggleFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(toggleFilePath, JSON.stringify({"bot_enabled": false}));
    }
    response["bot_enabled"] = false;
    res.status(200).json(response);
  }

  res.status(400).send();
});

app.get("/bot/set/request-toggle/:state?", (req, res) => {
  const validStates = ["enable", "disable"];

  let response = {"request_enabled": undefined};

  if (req.params.state == "enable") {
    if (fs.existsSync(toggleFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));
      fileContent["request_enabled"] = true;
      fs.writeFileSync(toggleFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(toggleFilePath, JSON.stringify({"request_enabled": true}));
    }
    response["request_enabled"] = true;
    res.status(200).json(response);
  }

  if (req.params.state == "disable") {
    if (fs.existsSync(toggleFilePath)) {
      let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));
      fileContent["request_enabled"] = false;
      fs.writeFileSync(toggleFilePath, JSON.stringify(fileContent));
    }
    else {
      fs.writeFileSync(toggleFilePath, JSON.stringify({"request_enabled": false}));
    }
    response["request_enabled"] = false;
    res.status(200).json(response);
  }

  res.status(400).send();
});

app.get("/bot/get-track-data", async (req, res) => {

  const input = req.query.trackId;

  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }
  
  const callSpotifyResult = await callSpotifyGetTrackData(input);
  return res.status(200).json(callSpotifyResult.data);

  }

});


app.get("/bot/get-request-type", (req, res) => {

  const input = req.query.query;


  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }

    let requestType = utilFunctions.detectSongRequestFormat(input);
    res.set("Content-Type", "text/plain");
    return res.status(200).send(requestType);

  }

});


app.get("/bot/search-song", async (req, res) => {

  const input = req.query.query;

  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }
  
  const callSpotifyResult = await callSpotifySearchTrack(input);
  return res.status(200).json(callSpotifyResult.data);

  }

});

app.get("/bot/now-playing", async (req, res) => {
  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let toggleFileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (toggleFileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }
  }

  if (fs.existsSync(dataFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    const currentTimestamp = Date.now();

    // checks if stored data age is less than 15 seconds
    // and serves the value from the data file
    if (currentTimestamp - fileContent["timestamp"] < 15000) {
      response["artistName"] = fileContent["artistName"];
      response["itemName"] = fileContent["itemName"];
      response["timestamp"] = fileContent["timestamp"];
      response["songLink"] = fileContent["songLink"];
      response["trackId"] = fileContent["trackId"];
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
      artistName = fileContent["artistName"];
      itemName = fileContent["itemName"];

      let formattedText = `Song link for [${artistName}] - [${itemName}]: ${songLink}`;

      res.set("Content-Type", "text/plain");
      return res.status(200).send(formattedText);
    }

    else {
      res.set("Content-Type", "text/plain");
      return res.status(404).send("No song link exists in data file");
    }

  }

});


app.post("/bot/add-song", async (req, res) => {
  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }

    if (fileContent["request_enabled"] == false) {
      return res.status(428).json({"error": "request_enabled is false"});
    }

  await addSongMainLogic(req, res);

  }

});


async function addSongMainLogic (req, res) {
  const input = req.query.song;

  const callSpotifyResult = await callSpotifyAddSong(input);
  if (callSpotifyResult.status == "Unauthorized") {

    const tokenRefreshResult = await callSpotifyTokenRefresh();
    if (tokenRefreshResult.status == "Failed") {
      return res.status(400).json({"error": "Unable to refresh token"});
    }

    const callSpotifyResult3 = await callSpotifyAddSong(input);
      if (callSpotifyResult3.status != "Succesful") {

        return res.status(503).json(
          {"error": "Unable to add song to queue after second attempt"});
      }
      else {
       const trackId = callSpotifyResult3.data.trackId;
       return res.status(200).json(
         {
           "result": "Song added", "trackId": trackId
         });
      }

  }
  else {
    const trackId = callSpotifyResult.data.trackId;
    return res.status(200).json(
      {
        "result": "Song added",
        "trackId": trackId
      });
  }
};


app.get("/bot/get-player-queue", async (req, res) => {
  let response = {};

  if (!fs.existsSync(credFilePath)) {
    return res.status(501).json({"error": "Credentials file does not exist"});
  }

  if (fs.existsSync(toggleFilePath)) {
    let fileContent = JSON.parse(fs.readFileSync(toggleFilePath, 'utf8'));

    if (fileContent["bot_enabled"] == false) {
      return res.status(428).json({"error": "bot_enabled is false"});
    }

  await getQueueMainLogic(req, res);

  }

});


async function getQueueMainLogic (req, res) {
  const callSpotifyResult = await callSpotifyGetQueue();
  if (callSpotifyResult.status == "Unauthorized") {

    const tokenRefreshResult = await callSpotifyTokenRefresh();
    if (tokenRefreshResult.status == "Failed") {
      return res.status(400).json({"error": "Unable to refresh token"});
    }

    const callSpotifyResult3 = await callSpotifyGetQueue();
      if (callSpotifyResult3.status != "Succesful") {

        return res.status(503).json(
          {"error": "Unable to request player queue after second attempt"});
      }
      else {
       return res.status(200).json(callSpotifyResult3.data)
      }

  }
  else {
    return res.status(200).json(callSpotifyResult.data)
  }
};


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


async function callSpotifyAddSong(input) {
  const credFileContent = JSON.parse(fs.readFileSync(credFilePath, 'utf8'));

  let trackId = utilFunctions.extractTrackId(input);
  let requestParameter = utilFunctions.constructAddSongUri(trackId);
  
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
    method: 'post',
    url: 'https://api.spotify.com/v1/me/player/queue',
    headers: {'Authorization': `Bearer ${credFileContent["SPOTIFY_ACCESS_TOKEN"]}`},
    params: {
      "uri": requestParameter
    }
  })
    .then(function (response) {
      if (response.hasOwnProperty('response')) {
        if (response.response.status == 401) {
          functionResponse = {"status": "Unauthorized"}
        }
      } else {
          // let dataToReturn = utilFunctions.extractQueueData(response.data);
          functionResponse = {"status": "Succesful", "data": {"trackId": trackId}}
      }
      return functionResponse;
    })
}


async function callSpotifyGetQueue() {
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
    url: 'https://api.spotify.com/v1/me/player/queue',
    headers: {'Authorization': `Bearer ${credFileContent["SPOTIFY_ACCESS_TOKEN"]}`}
  })
    .then(function (response) {
      if (response.hasOwnProperty('response')) {
        if (response.response.status == 401) {
          functionResponse = {"status": "Unauthorized"}
        }
      } else {
          let dataToReturn = utilFunctions.extractQueueData(response.data);
          functionResponse = {"status": "Succesful", "data": dataToReturn}
      }
      return functionResponse;
    })
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
            "trackId": response.data.item.id,
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

async function callSpotifyGetTrackData(trackId) {
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
    url: 'https://api.spotify.com/v1/tracks/' + trackId,
    headers: {'Authorization': `Bearer ${credFileContent["SPOTIFY_ACCESS_TOKEN"]}`}
  })
    .then(function (response) {
      if (response.hasOwnProperty('response')) {
        if (response.response.status == 401) {
          functionResponse = {"status": "Unauthorized"}
        }
      } else {
          let dataToReturn = {
            "artistName": response.data.artists[0].name,
            "itemName": response.data.name,
            "songLink": response.data.external_urls.spotify,
            "trackId": response.data.id,
            "duration_ms": response.data.duration_ms
          };
          functionResponse = {"status": "Succesful", "data": dataToReturn}
      }
      return functionResponse;
    })
}


async function callSpotifySearchTrack(searchInput) {
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
    url: 'https://api.spotify.com/v1/search?q=' + searchInput + '&type=track&limit=1',
    headers: {'Authorization': `Bearer ${credFileContent["SPOTIFY_ACCESS_TOKEN"]}`}
  })
    .then(function (response) {
      if (response.hasOwnProperty('response')) {
        if (response.response.status == 401) {
          functionResponse = {"status": "Unauthorized"}
        }
      } else {
          let dataToReturn = {
            "artistName": response.data.tracks.items[0].artists[0].name,
            "itemName": response.data.tracks.items[0].name,
            "songLink": response.data.tracks.items[0].external_urls.spotify,
            "trackId": response.data.tracks.items[0].id,
            "duration_ms": response.data.tracks.items[0].duration_ms
          };
          functionResponse = {"status": "Succesful", "data": dataToReturn}
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
