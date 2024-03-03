const express = require("express");

const fs = require("fs");
const path = require("path");


const app = express();


const DATA_FOLDER_NAME = 'data';


app.get("/bot/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});

app.get("/bot/toggle", (req, res) => {
  const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'data.json');

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
  const dataFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'data.json');

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

module.exports = app;
