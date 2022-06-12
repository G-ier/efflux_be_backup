const db = require('../../data/dbConfig');
const {WHERE_BY_NETWORK} = require("./selects");
const mapField = {
  campaign_id: 'sub1',
  adset_id: 'sub3'
}

const aggregateCampaignConversionReport = (network, day) =>{
switch(network){
  case 'system1':
    return db.raw(`  
                SELECT campaign, 
                AVG(revenue / CASE clicks::decimal WHEN 0 THEN null ELSE clicks::decimal END)::numeric(10,2) as ave_rpc
                FROM system1 as s1
                  INNER JOIN campaigns c ON s1.campaign_id = c.id AND c.traffic_source = 'facebook'
                GROUP BY s1.campaign  
              `);
  case 'unknown':
    if(day == 'today')
    return db.raw(`
                SELECT domain as campaign, MAX(epc) as ave_rpc
                FROM sedo_domain
                GROUP BY domain
              `);
    return db.raw(`  
                SELECT domain as campaign, 
                AVG(earnings / CASE clicks::decimal WHEN 0 THEN null ELSE clicks::decimal END)::numeric(10,2) as ave_rpc
                FROM sedo as sd
                  INNER JOIN campaigns c ON sd.sub1 = c.id AND c.traffic_source = 'facebook'
                GROUP BY sd.domain  
              `);
  
  case 'crossroads':
    return db.raw(`  
                SELECT campaign, 
                AVG(revenue / CASE clicks::decimal WHEN 0 THEN null ELSE clicks::decimal END)::numeric(10,2) as ave_rpc
                FROM system1 as s1
                  INNER JOIN campaigns c ON s1.campaign_id = c.id AND c.traffic_source = 'facebook'
                GROUP BY s1.campaign  
              `);
}

  }
module.exports = aggregateCampaignConversionReport;
