const json = require("express").json({ limit: "50mb" });
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const paginate = require("express-paginate");
const auth = require("../routes/auth");
const auth0 = require("../routes/auth0");
const users = require("../routes/users");
const crossroads = require("../routes/crossroads");
const amg = require("../routes/amg");
const facebook = require("../routes/facebook");
const jwtCheck = require("./jwtCheck");
const jwtPermissions = require("./jwtPermissions");
const ErrorHandler = require("./error");
const AuthUser = require("./authUser");
const isBot = require('./isBot');
const pixel = require("../routes/pixel");
const campaigns = require('../routes/campaigns');
const proper = require('../routes/proper');
const system1 = require('../routes/system1');
const knexLogger = require('./knexLogger');

const configureMiddleware = (server) => {
  server.use(helmet());
  server.use(cors());
  server.use(json);
  // server.use(knexLogger);
  server.use("/trk", isBot, pixel);
  server.use(morgan("dev"));
  server.use("/api/auth0", auth0);
  server.use(paginate.middleware(10, 50));
  server.use('/api/proper', proper);
  server.use(jwtCheck);
  server.use(jwtPermissions);
  server.use(AuthUser);
  server.use("/api/auth", auth);
  server.use("/api/users", users);
  server.use("/api/crossroads", crossroads);
  server.use("/api/amg", amg);
  server.use("/api/system1", system1);
  server.use("/api/facebook", facebook);
  server.use('/api/campaigns', campaigns);
  server.use(ErrorHandler);
};

module.exports = {
  configureMiddleware,
};
