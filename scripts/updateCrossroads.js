require('dotenv').config();
const moment = require('moment-timezone')
const { todayYMD } = require('../common/day');
const argv = require('minimist')(process.argv.slice(2), { string: ['date', 'account'], default: { date: todayYMD() } });
const { CROSSROADS_ACCOUNTS } = require('../constants/crossroads');
const { updateCrossroadsData } = require('../services/crossroadsService');

async function main() {
  const { date, account } = argv;

  const accounts = account ? CROSSROADS_ACCOUNTS.filter(acc => acc.id === account) : CROSSROADS_ACCOUNTS;

  if (!moment(date, 'YYYY-MM-DD').isValid()) {
    throw new Error('Invalid Date argument');
  }
  const isFinal = date !== todayYMD()

  await Promise.all(accounts.map((account) => {
    return updateCrossroadsData(account, date);
  }));
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
})
