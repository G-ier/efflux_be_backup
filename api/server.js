const express = require("express");
const { configureMiddleware } = require("../middleware");
const { initializeCronJobs } = require("../cron");

// init express
const server = express();

// index route displays name
server.get("/", (req, res) => {
  res.send(
    '<h1 style="color: red; text-align: center; font-size: 40px;">Efflux Server</h1>'
  );
});

// Configuring global middle ware
configureMiddleware(server);

// initialize Cron jobs
initializeCronJobs();

module.exports = server;
