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

function todayYMDHM() {
  return moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss');
}

function yesterdayYMDHM(date) {
  const m = date ? moment(date) : moment().tz('America/Los_Angeles');
  return m.subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
}

function todayHH(diff = 0, timeZone = 'America/Los_Angeles') {
  return moment().add(diff, 'hours').tz(timeZone).format('H');
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
  todayYMDHM,
  todayHH,
  dayYMD,
  yesterdayYMDHM,
  dayYMDHM,
  threeDaysAgoYMD,
  fourDaysAgoYMD,
  dayHH,
  convertDayYMD,
  convertDayHH,
  dayBeforeYesterdayYMD,
  someDaysAgoYMD
};
