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
const develop = require('../routes/develop');

var corsOptions = {
  origin: 'https://main.d29s44dh6ax376.amplifyapp.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Tracking requests from postback servers are allowed without authentication.
// The other routes are meant to be accessed from the dashboard with authenticated users and they
// basically populate the dashboard with data.
function configureMiddleware(server) {
  // server.use(cors(corsOptions));
  // server.use(helmet());
  server.use(json);
  // server.use(knexLogger);
  server.use("/trk", isBot, pixel);
  server.use(morgan("dev"));
  server.use("/api/auth0", cors(corsOptions), auth0);
  server.use('/api/develop', cors(corsOptions), develop);
  server.use(paginate.middleware(10, 50));
  server.use('/api/proper', cors(corsOptions), proper);
  server.use(jwtCheck);
  server.use(jwtPermissions);
  server.use(AuthUser);
  server.use("/api/auth", cors(corsOptions), auth);
  server.use("/api/users", cors(corsOptions), users);
  server.use("/api/crossroads", cors(corsOptions), crossroads);
  server.use("/api/amg", cors(corsOptions), amg);
  server.use("/api/system1", cors(corsOptions), system1);
  server.use("/api/facebook", cors(corsOptions), facebook);
  server.use('/api/campaigns', cors(corsOptions), campaigns);

}

module.exports = {
  configureMiddleware,
};
