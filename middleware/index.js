// Utility middleware
const json = require("express").json({ limit: "50mb" });
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const paginate = require("express-paginate");

// Custom middleware for authentication
const jwtCheck = require("./jwtCheck");
const jwtPermissions = require("./jwtPermissions");
const ErrorHandler = require("./error");
const AuthUser = require("./authUser");
const isBot = require("./isBot");

// Postback route
const postback = require("../src/shared/routes/postback");

// New routes
const temp = require("../src/modules/temp/routes");
const facebook = require("../src/modules/facebook/routes");
const tiktok = require("../src/modules/tiktok/routes");
const taboola = require("../src/modules/taboola/routes");
const scrappedAds = require("../src/modules/scrappedAds/routes");
const aggregations = require("../src/modules/aggregates/routes");
const sedo = require("../src/modules/sedo/routes");
const crossroadsRoutes = require("../src/modules/crossroads/routes");
const auth = require("../src/modules/auth/routes");
const funnelFlux = require("../src/modules/funnelFlux/routes");
const management = require("../src/shared/routes/management");
const crossroadRouter = express.Router();
crossroadRouter.use(crossroadsRoutes);
const EnvironmentVariablesManager = require("../src/shared/services/EnvironmentVariablesManager");

// Routes Logger
const routesLogger = require("./routeLoggers");

var livereload = require("livereload");
var connectLiveReload = require("connect-livereload");

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// Tracking requests from postback servers are allowed without authentication.
// The other routes are meant to be accessed from the dashboard with authenticated users and they
// basically populate the dashboard with data.
function configureMiddleware(server) {

  // Routes Logger
  server.use(routesLogger);

  // Utility middleware
  server.use(connectLiveReload());
  server.use(helmet());
  server.use(cors());
  server.use(json);
  server.use(morgan("dev"));

  // Postback route
  server.use("/trk", isBot, postback);

  // Pagination middleware
  server.use(paginate.middleware(10, 50));

  // Authentication routes
  if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== "true") {
    server.use(jwtCheck);
    server.use(jwtPermissions);
    server.use(AuthUser);
  }

  // Replaced
  server.use("/api/temp", temp); // This will be replaced by the new routes
  server.use("/api/auth", auth);
  server.use("/api/facebook", facebook);
  server.use("/api/tiktok", tiktok);
  server.use("/api/taboola", taboola);
  server.use("/api/composite-ad", scrappedAds);
  server.use("/api/aggregations", aggregations);
  server.use("/api/crossroads", crossroadRouter);
  server.use("/api/sedo", sedo);
  server.use("/api/management", management);
  server.use("/api/ff", funnelFlux);

  server.use(ErrorHandler);
}

module.exports = {
  configureMiddleware,
};
