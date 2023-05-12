const { configureMiddleware } = require("../middleware");
const { initializeCronJobs } = require("../cron");

const express = require("express");
const fs = require('fs');
const https = require('https');

const httpsOptions = {
  key: fs.readFileSync('./ssl/pvt-key.key'),
  cert: fs.readFileSync('./ssl/efflux-backend_com.crt'),
  ca: fs.readFileSync('./ssl/efflux-backend_com.ca-bundle')
}

// init express
const server = express();
const app = https.createServer(httpsOptions, server);

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

module.exports = {
  server,
  app
};
