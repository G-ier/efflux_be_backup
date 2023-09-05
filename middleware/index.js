const json = require("express").json({ limit: "50mb" });
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const paginate = require("express-paginate");
const auth = require("../routes/auth");
const auth0 = require("../routes/auth0");
const users = require("../routes/users");
const amg = require("../routes/amg");
const facebook = require("../routes/facebook");
const jwtCheck = require("./jwtCheck");
const jwtPermissions = require("./jwtPermissions");
const ErrorHandler = require("./error");
const AuthUser = require("./authUser");
const isBot = require("./isBot");
const pixel = require("../routes/pixel");
const campaigns = require("../routes/campaigns");
const proper = require("../routes/proper");
const system1 = require("../routes/system1");
const knexLogger = require("./knexLogger");
const develop = require("../routes/develop");
const userAccounts = require("../routes/userAccounts");
const medianet = require("../routes/medianet");
const mediaBuyers = require("../routes/mediaBuyers");
const columnPresets = require("../routes/columnPresets");
const scrappedAds = require("../src/modules/scrappedAds/routes");

const crossroadsRoutes = require("../src/modules/crossroads/routes");

const crossroadsRoutes = require("../src/modules/crossroads/routes");
const crossroads = require("../routes/crossroads");
const crossroadRouter = express.Router();

crossroadRouter.use(crossroadsRoutes);
crossroadRouter.use(crossroads);

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
  server.use(connectLiveReload());
  server.use(helmet());
  server.use(cors());
  server.use(json);
  // server.use(knexLogger);
  server.use("/trk", isBot, pixel);
  server.use(morgan("dev"));
  server.use("/api/auth0", auth0);
  server.use("/api/develop", develop);
  server.use(paginate.middleware(10, 50));
  server.use("/api/proper", proper);
  server.use(jwtCheck);
  server.use(jwtPermissions);
  server.use(AuthUser);
  server.use("/api/auth", auth);
  server.use("/api/media-buyers", mediaBuyers);
  server.use("/api/column-presets", columnPresets);
  server.use("/api/users", users);
  server.use("/api/crossroads", crossroadRouter);
  server.use("/api/medianet", medianet);
  server.use("/api/amg", amg);
  server.use("/api/system1", system1);
  server.use("/api/facebook", facebook);
  server.use("/api/campaigns", campaigns);
  server.use("/api/users/user_accounts", userAccounts);
  server.use("/api/composite-ad", scrappedAds);
  server.use(ErrorHandler);
}

module.exports = {
  configureMiddleware,
};
