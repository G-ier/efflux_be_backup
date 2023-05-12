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

const port = process.env.PORT || 5000;
const http_port = process.env.HTTP_PORT || 4999;

app_htttp.listen(http_port, () =>
  console.log(`🔥 -------- HTTP listening on port ${http_port} ---------- 🔥`)
);

app_htttps.listen(port, () =>
  console.log(`🔥 -------- HTTPS listening on port ${port} ---------- 🔥`)
);
