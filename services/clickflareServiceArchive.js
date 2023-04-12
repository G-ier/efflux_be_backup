const _ = require('lodash');
const db = require('../data/dbConfig');

function logConversion(clickflareData) {
    let x = 0
    clickflareData.forEach((log) => {
      if (log.ConversionPayout > 0 && x < 1) {
        console.log(log)
        x = x + 1
      }
    })
}
  
function printAttributes(obj) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        console.log(key + ': ' + obj[key]);
      }
    }
    console.log("=".repeat(210))
}

/**
 * @name processClickflareData
 * @returns {Promise<Array<object>>}
 */

async function processClickflareFBData(data) {

    return data.filter(item => item.ConnectionReferrer.includes(PROVIDERS.FACEBOOK)).map(item => {
        return {
        ad_id: item.TrackingField1,
        adset_id: item.TrackingField2,
        campaign_id: item.TrackingField3,
        adset_name: item.TrackingField5,
        campaign_name: item.TrackingField6,
        traffic_source: PROVIDERS.FACEBOOK,
        date: dayYMD(item.ClickTime),
        hour: dayHH(item.ClickTime),
        revenue: item.ConversionPayout,
        event_type: item.EventType,
        external_id: item.ExternalID,
        flow_id: item.FlowID,
        click_id: item.ClickID,
        click_time: item.ClickTime,
        connection_ip: item.ConnectionIP,
        connection_referrer: item.ConnectionReferrer,
        device_user_agent: item.DeviceUserAgent,
        visit_id: item.VisitID,
        traffic_source_id: item.TrafficSourceID
        }
    })
}

async function processClickflareTTData(data) {
    return data.filter(item => item.ConnectionReferrer.includes(PROVIDERS.TIKTOK)).map(item => {
        return {
        campaign_id: item.TrackingField1,
        campaign_name: item.TrackingField2,
        adset_id: item.TrackingField3,
        adset_name: item.TrackingField4,
        ad_id: item.TrackingField5,
        traffic_source: PROVIDERS.TIKTOK,
        date: dayYMD(item.ClickTime),
        hour: dayHH(item.ClickTime),
        revenue: item.Cost,
        event_type: item.EventType,
        external_id: item.ExternalID,
        flow_id: item.FlowID,
        click_id: item.ClickID,
        click_time: item.ClickTime,
        connection_ip: item.ConnectionIP,
        connection_referrer: item.ConnectionReferrer,
        device_user_agent: item.DeviceUserAgent,
        visit_id: item.VisitID,
        traffic_source_id: item.TrafficSourceID
        }
    })
}

// When the revenue is updated, the old rows are left there. Ending up with dublicates.
async function updateClickflareTB(data, provider) {
    const fields = ["traffic_source_id","visit_id","device_user_agent", "connection_referrer","connection_ip", "click_time", "click_id", "flow_id", "external_id", "event_type", "revenue", "traffic_source", "campaign_id", "adset_id", "ad_id"];

    // Select existing and create a object with keys of almost every value in the field array above.
    const existedClickflare = await db.select("*")
        .from("clickflare")
        .where({traffic_source: provider});
        const existedClickflareMap = _.keyBy(existedClickflare, (item) => {
        return `${item.traffic_source_id}||${item.visit_id}||${item.device_user_agent}||${item.connection_referrer}||${item.connection_ip}||${item.click_time}||${item.click_id}||${item.flow_id}||${item.external_id}||${item.event_type}||${item.revenue}||${item.traffic_source}||${item.campaign_id}||${item.adset_id}||${item.ad_id}`
    });

    // Group rows by whether they exist or no in the database.
    const {skipArr = [], createArr = []} = _.groupBy(data, item => {
        // Existing check works by attempting to find a key in the above existedClickflareMap object.
        const existedClickflare = existedClickflareMap[`${item.traffic_source_id}||${item.visit_id}||${item.device_user_agent}||${item.connection_referrer}||${item.connection_ip}||${item.click_time}||${item.click_id}||${item.flow_id}||${item.external_id}||${item.event_type}||${item.revenue}||${item.traffic_source}||${item.campaign_id}||${item.adset_id}||${item.ad_id}`];
        if (!existedClickflare) return "createArr";
        if (existedClickflare) {
        return "skipArr";
        }
    });

    // If there's any value to insert insert it in chunks of 500
    if (createArr.length) {
        const clickChunks = _.chunk(createArr, 500);
        for (const chunk of clickChunks) {
        await db("clickflare").insert(chunk);
        }
        console.log(`CREATED clickflare ${provider} LENGTH`, createArr.length)
    }
    console.log(`SKIPPED clickflare ${provider} LENGTH`, skipArr.length)
}
