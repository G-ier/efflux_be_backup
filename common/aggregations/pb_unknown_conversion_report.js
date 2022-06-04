const db = require('../../data/dbConfig');
const { threeDaysAgoYMD, tomorrowYMD, yesterdayYMD } = require('../day');
const mapField = {
  campaign_id: 'sub1',
  adset_id: 'sub3'
}
const aggregatePBUnknownConversionReport = (options) => {
  switch(options.table) {
    case 'system1' :
      return db.raw(`      
      SELECT * FROM system1
      WHERE 
        created_at > '${yesterdayYMD(null)}' AND
        created_at <= '${tomorrowYMD(null)}' AND
        (campaign_id IS NULL OR
        campaign_name IS NULL OR
        adset_id IS NULL OR
        ad_id IS NULL OR
        campaign IS NULL)
      ORDER BY id DESC
    `);
    case 's1_conversions' :
      return db.raw(`      
      SELECT * FROM s1_conversions
      WHERE 
        created_at > '${yesterdayYMD(null)}' AND
        created_at <= '${tomorrowYMD(null)}' AND
        (campaign_id IS NULL OR
        ad_id IS NULL OR
        adset_id IS NULL)
      ORDER BY id DESC
    `);
    case 'sedo' :
      return db.raw(`      
      SELECT * FROM sedo
      WHERE 
        created_at > '${yesterdayYMD(null)}' AND
        created_at <= '${tomorrowYMD(null)}' AND
        (sub1 IS NULL OR
        sub2 IS NULL OR
        sub3 IS NULL)
      ORDER BY id DESC
    `);
    case 'sedo_conversions' :
      return db.raw(`      
      SELECT * FROM sedo_conversions
      WHERE 
        created_at > '${yesterdayYMD(null)}' AND
        created_at <= '${tomorrowYMD(null)}' AND
        (sub1 IS NULL OR
        sub2 IS NULL OR
        sub3 IS NULL)
      ORDER BY id DESC
    `);
  }
}

module.exports = aggregatePBUnknownConversionReport;
