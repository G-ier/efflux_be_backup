const { availableStatuses } = require("./constants");

function validateInput({ type, token, status }) {
  if (!type || (type !== "adset" && type !== "campaign")) {
    throw Error("Type must be either 'adset' or 'campaign'.");
  }
  if (!token) {
    throw Error("Token is required.");
  }
  if (status && !availableStatuses.includes(status)) {
    throw Error("Status is not valid.");
  }
}

module.exports = { validateInput };

