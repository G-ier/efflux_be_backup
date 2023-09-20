require('dotenv').config();
const moment = require('moment-timezone')
const { todayYMD, todayHH } = require('../common/day');
const argv = require('minimist')(process.argv.slice(2), { string: 'date', default: { date: todayYMD('UTC') } });

const { updateFacebookData, updateFacebookInsights} = require('../controllers/facebookController');

async function main() {
  const { date } = argv;
  if (!moment(date, 'YYYY-MM-DD').isValid()) {
    throw new Error('Invalid Date argument');
  }
  await updateFacebookData(date);
  await updateFacebookInsights(date);
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
})
