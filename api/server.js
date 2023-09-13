const { configureMiddleware } = require("../middleware");
const { initializeCronJobs } = require("../cron");

const express = require("express");

// init express
const server = express();
// index route displays name
server.get("/", (req, res) => {
  res.send(
    '<h1 style="color: red; text-align: center; font-size: 40px;">Efflux Server Updated!</h1>'
  );
});

// Configuring global middle ware
configureMiddleware(server);

// initialize Cron jobs
initializeCronJobs();

// Trigger Build
module.exports = {
  server
};
