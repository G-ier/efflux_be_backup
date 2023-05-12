require("dotenv").config();

const { server, app_htttps, app_htttp } = require("./api/server");
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
// 404
server.use(function (req, res, next) {
  return res
    .status(404)
    .send({ message: "[Route] --> " + req.url + " <-- Not found." });
});
// 500 - Any server error
server.use(function (err, req, res, next) {
  return res.status(500).json({ error: err });
});

const port = 443 //process.env.PORT || 5000;
const hostname = "efflux-backend.com"

app_htttps.listen(port, () =>
  console.log(`🔥 -------- listening on port ${hostname}:${port} ---------- 🔥`)
);
app_htttp.listen(5000, () =>
  console.log(`🔥 -------- listening on port ${hostname}:${5000} ---------- 🔥`)
);
