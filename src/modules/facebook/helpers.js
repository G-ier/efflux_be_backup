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

function listDatesBetween(startDateStr, endDateStr) {
  let startDate = new Date(startDateStr);
  let endDate = new Date(endDateStr);

  let dateArray = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

module.exports = { validateInput, listDatesBetween };

