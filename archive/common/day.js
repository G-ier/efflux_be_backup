const moment = require('moment-timezone');

function todayYMD(timeZone = 'America/Los_Angeles') {
  return moment().tz(timeZone).format('YYYY-MM-DD');
}

function yesterdayYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(1, 'days').format('YYYY-MM-DD');
}

function dayBeforeYesterdayYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(2, 'days').format('YYYY-MM-DD');
}

function tomorrowYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.add(1, 'days').format('YYYY-MM-DD');
}

function dayAfterTomorrowYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.add(2, 'days').format('YYYY-MM-DD');
}

function todayYMDHM(timezone = 'America/Los_Angeles') {
  return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
}

function yesterdayYMDHM(date) {
  const m = date ? moment(date) : moment().tz('America/Los_Angeles');
  return m.subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
}

function todayHH(diff = 0, timeZone = 'America/Los_Angeles') {
  return moment().add(diff, 'hours').tz(timeZone).format('H');
}

function todayM(diff = 0, timeZone = 'America/Los_Angeles') {
  return moment().add(diff, 'minutes').tz(timeZone).format('mm');
}

function dayHH(date) {
  return moment(date).tz('America/Los_Angeles').format('H');
}

function convertDayYMD(date, timeZone = 'EST') {
  return moment.tz(date, timeZone).tz('America/Los_Angeles').format('YYYY-MM-DD');
}

function convertDayHH(date, timeZone = 'EST') {
  return moment.tz(date, timeZone).tz('America/Los_Angeles').format('H');
}

function dayYMD(date) {
  return moment(date).tz('America/Los_Angeles').format('YYYY-MM-DD');
}

function dayYMDHM(date, timeZone = 'America/Los_Angeles') {
  return moment(date).tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
}

function todayTenMinsAgoYMDHM(timeZone = 'America/Los_Angeles') {
  return moment().tz(timeZone).subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
}
function todayFifteenMinsAgoYMDHM(timeZone = 'America/Los_Angeles') {
  return moment().tz(timeZone).subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss');
}

function someTimeAgoYMDHM(num, unit, timeZone = 'America/Los_Angeles') {
  return moment().tz(timeZone).subtract(num, unit).format('YYYY-MM-DD HH:mm:ss');
}

function threeDaysAgoYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(3, 'days').format('YYYY-MM-DD');
}

function fourDaysAgoYMD(date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(4, 'days').format('YYYY-MM-DD');
}

function someDaysAgoYMD(days, date, timeZone = 'America/Los_Angeles') {
  const m = date ? moment(date) : moment().tz(timeZone);
  return m.subtract(days, 'days').format('YYYY-MM-DD');
}

module.exports = {
  todayYMD,
  yesterdayYMD,
  tomorrowYMD,
  dayAfterTomorrowYMD,
  todayYMDHM,
  todayHH,
  todayM,
  dayYMD,
  yesterdayYMDHM,
  dayYMDHM,
  threeDaysAgoYMD,
  fourDaysAgoYMD,
  dayHH,
  convertDayYMD,
  convertDayHH,
  dayBeforeYesterdayYMD,
  someDaysAgoYMD,
  todayTenMinsAgoYMDHM,
  todayFifteenMinsAgoYMDHM,
  someTimeAgoYMDHM
};
