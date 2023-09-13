const moment = require("moment-timezone");

function someDaysAgoYMD(days, date, timeZone = "America/Los_Angeles") {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(days, "days").format("YYYY-MM-DD");
}
function todayHH(diff = 0, timeZone = "America/Los_Angeles") {
  return moment().add(diff, "hours").tz(timeZone).format("H");
}
function todayM(diff = 0, timeZone = "America/Los_Angeles") {
  return moment().add(diff, "minutes").tz(timeZone).format("mm");
}
module.exports = {
  todayHH,
  todayM,
  someDaysAgoYMD,
};
