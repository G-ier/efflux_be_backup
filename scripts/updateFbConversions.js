const _ = require('lodash');
const db = require('../data/dbConfig');
const { dayHH } = require('../common/day');

async function main() {
  const fb_conversions = await db.select('id', 'created_at').from('fb_conversions').whereNull('hour')
  console.log('fb_conversions', fb_conversions)
  for(const conversion of fb_conversions) {
    const hour = dayHH(conversion.created_at);
    console.log('created_at:', conversion.created_at, 'hour:', hour)
    await db('fb_conversions').where('id', conversion.id).update({hour: hour})
  }

}

main().then(() => {
  console.info('Done')
  process.exit(0)
}).catch((err) => {
  console.error(err);
  process.exit(1);
})
