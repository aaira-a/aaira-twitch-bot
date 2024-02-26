const express = require("express");

const app = express();


app.get("/bot/hello", (req, res) => {
  res.json({
    "hello": "world"
  })
});


module.exports = app;
