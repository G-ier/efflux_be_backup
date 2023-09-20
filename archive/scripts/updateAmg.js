const moment = require("moment-timezone");
const { updateAMGData, getAMGData} = require("../services/amgService");
const { todayYMD } = require("../common/day");
const argv = require('minimist')(process.argv.slice(2), { string: ['date'], default: { date: todayYMD() } })

async function main() {
  const { date } = argv;

  if (!moment(date, 'YYYY-MM-DD').isValid()) {
    throw new Error('Invalid Date argument');
  }

  const { data } = await getAMGData(date) || {};
  await updateAMGData(data, date);
}

main().then(() => {
  console.info('Done')
  process.exit(0)
}).catch((err) => {
  console.error(err);
  process.exit(1);
})
