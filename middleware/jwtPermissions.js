require("dotenv");
const jwtAuthz = require("express-jwt-authz");

module.exports = jwtAuthz(["admin", "media_buyer"], {
  customScopeKey: "permissions",
});
