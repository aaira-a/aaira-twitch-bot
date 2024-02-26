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
  const toggleFilePath = path.join(__dirname, DATA_FOLDER_NAME, 'toggle_enabled');

  let response = {"status": "undefined"};

  if (fs.existsSync(toggleFilePath)) {
    response["status"] = "enabled";
  }
  else {
    response["status"] = "disabled";
  }

  res.status(200).json(response);

});

module.exports = app;
