const moment = require('moment-timezone');
const eachLimit = require('async/eachLimit');
const db = require('../data/dbConfig');
const {update} = require("../common/models");

async function main() {
  const {rows: [{rows_count}]} = await db.raw(`
    select count(facebook.id) as rows_count
    from facebook
         inner join campaigns c on facebook.campaign_id = c.id
         inner join ad_accounts aa on aa.id = c.ad_account_id;`);

  const total = Number(rows_count);
  const limit = 1000;

  let totalProcessed = 0
  let totalFixed = 0;

  console.log('Total count of FBs:', total);
  console.log('Process...');
  for (let offset = 0; offset < total; offset += limit) {
    const {rows} = await db.raw(`
    select facebook.id     as id,
       facebook.date       as date,
       facebook.hour       as hour,
       facebook.created_at as created_at,
       aa.tz_name          as tz_name
    from facebook
         inner join campaigns c on facebook.campaign_id = c.id
         inner join ad_accounts aa on aa.id = c.ad_account_id AND aa.tz_name IS NOT NULL
    order by facebook.created_at
    limit ${limit} offset ${offset};`);

    const fb_processed = [];
    rows.forEach((item) => {
      const {date, hour, created_at, tz_name} = item;
      const correctDate = moment(created_at).tz(tz_name).format('YYYY-MM-DD');
      const correctHour = Number(moment(created_at).tz(tz_name).format('H'));
      if (date !== correctDate || hour !== correctHour) {
        fb_processed.push({
          ...item,
          date: correctDate,
          hour: correctHour,
        });
      }
    });

    if (fb_processed.length) {
      await eachLimit(fb_processed, 20, (item, cb) => {
        update('facebook', item.id, {date: item.date, hour: item.hour}).then(() => cb(null)).catch((err) => cb(err));
      });
      totalFixed += fb_processed.length;
    }
    totalProcessed += rows.length;
    console.log(`${totalProcessed} out of ${total} have been processed`);
  }
  console.log('...end');
  console.log('Total FBs have been fixed:', totalFixed);
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
})
