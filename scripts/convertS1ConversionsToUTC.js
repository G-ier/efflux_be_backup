const moment = require("moment-timezone");
const db = require('../data/dbConfig');

async function main() {
  const s1_conversions = await db.select('id', 'created_at').from('s1_conversions').whereNull('hour')
  for(const conversion of s1_conversions) {
    const hour = moment(conversion.created_at).tz('UTC').format('HH')
    const date = moment(conversion.created_at).tz('UTC').format('YYYY-MM-DD')
    await db('s1_conversions').where('id', conversion.id).update({date, hour})
  }
}

main().then(() => {
  console.info('Done')
  process.exit(0)
}).catch((err) => {
  console.error(err);
  process.exit(1);
})
