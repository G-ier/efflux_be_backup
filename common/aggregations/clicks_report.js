const db = require('../../data/dbConfig');
const {
  dayYMD, yesterdayYMD, dayYMDHM, yesterdayYMDHM,
} = require('../day');

const clicksReport = (date) => db.raw(`
    SELECT pc.* FROM pixel_clicks pc
    LEFT JOIN
      (SELECT fbclid, date FROM cr_conversions
        WHERE date >= '${yesterdayYMD(date)}'
        AND date < '${dayYMD(date)}'
      ) crc ON pc.fbclid = crc.fbclid
    WHERE crc.fbclid ISNULL
    AND pc.created_at > '${yesterdayYMDHM(date)}'
    AND pc.created_at < '${dayYMDHM(date)}'
`);

module.exports = clicksReport;
