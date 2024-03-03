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

module.exports = app;
