const route = require("express").Router();
const _ = require('lodash');

const db = require('../../data/dbConfig');
const { yesterdayYMD, someDaysAgoYMD, todayYMD } = require("../../common/day");
const { preferredOrder } = require("../../controllers/spreadsheetController")
const { updateSpreadsheet } = require("../../services/spreadsheetService")
const { TEMPLATE_SHEET_VALUES, sheetsArr } = require('../../constants/templateSheet');


function mergeDictionaries(list1, list2) {
  const combined = [];

  list1.forEach(dict1 => {
    const match = list2.find(dict2 => dict1.tracking_field_3 === dict2.campaign_id);
    let combinedDict = { ...dict1 };
    delete combinedDict.tracking_field_3;

    if (match) {
      combinedDict = { ...match, ...combinedDict };
    } else {
      combinedDict.campaign_id = dict1.tracking_field_3;
      for (const key in list2[0]) {
        if (!(key in combinedDict)) {
          combinedDict[key] = 'Missing Record';
        }
      }
    }
    combined.push(combinedDict);
  });

  list2.forEach(dict2 => {
    const match = list1.find(dict1 => dict1.tracking_field_3 === dict2.campaign_id);
    if (!match) {
      const missingDict = { ...dict2 };
      for (const key in list1[0]) {
        if (!(key in missingDict)) {
          missingDict[key] = 'Missing Record';
        }
      }
      delete missingDict.tracking_field_3;
      combined.push(missingDict);
    }
  });

  return combined;
}

function calculateValuesForAggSpreadsheet(data, columns){

  const rows = data.map(item => {
    const result = {
      // facebook
      ad_account_name: item.ad_account_name,
      time_zone: item.time_zone,
      campaign_name: item.campaign_name,
      campaign_id: item.campaign_id,
      status: item.status,
      launch_date: item.launch_date,
      amount_spent: item.amount_spent,
      impressions: item.impressions,
      reach: null,
      frequency: null,
      link_clicks: item.link_clicks,
      cpc_link_click: item.cpc_link_click,
      clicks_all: null,
      cpc_all: null,
      cpm: item.cpm,
      ctr_fb: item.ctr_fb,
      results: null,
      cost_per_result: null,
      fb_last_update: item.fb_updated_at,

      // crossroads
      visitors: item.visitors,
      lander_visits: item.lander_visits,
      lander_searches: item.lander_searches,
      revenue_events: item.revenue_events,
      ctr_cr: item.ctr_cr,
      rpc: item.rpc,
      rpm: item.rpm,
      rpv: item.rpv,
      publisher_revenue: item.publisher_revenue,
      cr_last_update: item.cr_updated_at,

      // clickflare
      tr_visits: item.tr_visits,
      tr_searches: null,
      tr_conversions: item.tr_conversions,
      tr_ctr: item.tr_ctr,
      tr_revenue: item.tr_revenue,
      cf_last_update: item.created_at

    }
    return preferredOrder(result, columns)
  })
  return {columns, rows}
}

async function templateSheetFetcher(startDate, endDate, telemetry=false) {

    // Fetch data from facebook and campaigns table
    let facebook_data = await db.raw(`
      SELECT
          ad.name as ad_account_name, ad.tz_name as time_zone,
          c.name as campaign_name, c.id as campaign_id, c.status, c.created_time as launch_date,
          CAST(SUM(fb.total_spent) AS FLOAT) as amount_spent,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions,
          CAST(ROUND(SUM(fb.link_clicks), 2) AS FLOAT) as link_clicks,
          TRUNC(CASE WHEN SUM(fb.total_spent::numeric) = 0 THEN 0 ELSE (SUM(fb.link_clicks)::numeric / SUM(fb.total_spent)::numeric) END, 4) as cpc_link_click,
          TRUNC(CASE WHEN SUM(fb.impressions::numeric) = 0 THEN 0 ELSE (SUM(fb.total_spent)::numeric / (SUM(fb.impressions::numeric) / 1000::numeric)) END, 4) as cpm,
          TRUNC(CASE WHEN SUM(fb.impressions)::numeric = 0 THEN 0 ELSE (SUM(fb.link_clicks)::numeric / SUM(fb.impressions)::numeric) END, 5) / 100 || '%' as ctr_fb,
          MAX(fb.updated_at) as fb_updated_at
      FROM facebook fb
        LEFT JOIN campaigns c ON fb.campaign_id = c.id
        LEFT JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE fb.created_at > '${startDate}' AND fb.created_at < '${endDate}'
      GROUP BY ad.name, ad.tz_name, c.name, c.id, c.status, c.created_time;
    `)

    // Fetch data from clickflare table
    let clickflare_data = await db.raw(`
      SELECT 
        td.tracking_field_3,
        CAST(ROUND(SUM(td.conversion_payout), 2) AS FLOAT) as tr_revenue,
        CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as tr_visits,
        CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as tr_clicks,
        CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as tr_conversions,
        ROUND(CAST(CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS float) 
        / CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS float) * 100 as numeric), 2)  || '%' as tr_ctr,
        MAX(created_at) as created_at
      FROM tracking_data td 
      WHERE td.visit_time > '${startDate}' AND td.visit_time < '${endDate}' AND traffic_source_id IN ('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445','622f32e17150e90012d545ec', '62f194b357dde200129b2189')
      GROUP BY td.tracking_field_3;
    `)
    
    // Fetch data from crossroads table
    let crossroads_data = await db.raw(`
      SELECT 
        cr.campaign_id as tracking_field_3,
        SUM(cr.total_tracked_visitors) as visitors,
        SUM(cr.total_lander_visits) as lander_visits,
        SUM(cr.total_searches) as lander_searches,
        SUM(cr.total_revenue_clicks) as revenue_events,
        CASE WHEN SUM(total_tracked_visitors) = 0 THEN null ELSE ROUND(CAST(CAST(SUM(total_revenue_clicks) as float) / CAST(SUM(total_tracked_visitors) as float) * 100 as numeric), 2) || '%' END ctr_cr,
        CASE WHEN SUM(total_revenue_clicks) = 0 THEN null ELSE ROUND(CAST(SUM(total_revenue) / SUM(total_revenue_clicks) as numeric), 2) END rpc,
        CASE WHEN SUM(total_tracked_visitors) = 0 THEN null ELSE ROUND(CAST(SUM(total_revenue) / SUM(total_tracked_visitors) * 1000 as numeric), 2) END rpm,
        CASE WHEN SUM(total_tracked_visitors) = 0 THEN null ELSE ROUND(CAST(SUM(total_revenue) / SUM(total_tracked_visitors)as numeric), 2) END rpv,
        SUM(total_revenue) as publisher_revenue,
        MAX(updated_at) as cr_updated_at
      FROM crossroads cr
      WHERE date(date) >= date('${startDate}') AND date(date) <= '${endDate}' AND traffic_source = 'facebook'
      GROUP BY cr.campaign_id;
    `)

    // Intersection clickflare with facebook data
    const result = mergeDictionaries(clickflare_data.rows, facebook_data.rows);
    const result2 = mergeDictionaries(crossroads_data.rows, result);

    if (telemetry) {
      console.log(
        " Clickflare Results", clickflare_data.rows.length, "\n",
        "Facebook Results", facebook_data.rows.length, "\n",
        "Crossroads Results", crossroads_data.rows.length, "\n",
        "No of results after merge 1", result.length, "\n",
        "No of results after merge 2", result2.length, "\n",
        result2);
    }

    console.log("Result 1: ");
    console.log(result[0]);
    console.log("Result 2: ");
    console.log(result2[0]);
    return result2
}

// @route     /api/debug-cron-jobs
// @desc     Runs Cron Jobs
route.get("/debug-cron-jobs", async (req, res) => {

  try {

    for (i=0; i < sheetsArr.length; i ++ ) {
      console.log("test");
      // Calculating start-date, end-date for each tab in the sheetsArr[i]
      let min_date = '2023-04-24 00:00:00'//someDaysAgoYMD(sheetsArr[i].day - 1, null, 'UTC'); 
      let endDay = '2023-04-24 23:59:59'//sheetsArr[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null, 'UTC'); 
      //min_date = min_date + ' 00:00:00';
      //endDay = endDay + ' 23:59:59';
      console.log(sheetsArr[i].sheetName, "Min Date: ", min_date, "End Date: ", endDay);
      const data = await templateSheetFetcher(min_date, endDay)

      // Formating the spreadsheet data and sorting it.
      let aggregatedData = calculateValuesForAggSpreadsheet(data, TEMPLATE_SHEET_VALUES)
      // Sort the list of dictionaries by putting those which we find in the database first
      aggregatedData.rows.sort(function(a, b) {
        // compare the "missing" attributes
        if (a.campaign_name === 'Missing Record' && b.campaign_name !== 'Missing Record') {
            return 1; // move 'a' to the end of the list
        } else if (a.campaign_name !== 'Missing Record' && b.campaign_name === 'Missing Record') {
            return -1; // move 'b' to the end of the list
        } else {
            return 0; // leave the order unchanged
        }
      });
      // Updating the spreadsheet with the sorted list.
      await updateSpreadsheet(
        aggregatedData, 
        {spreadsheetId: sheetsArr[i].spreadsheetId, sheetName: sheetsArr[i].sheetName}, 
        predifeniedRange=`!A3:AJ1000`,
        include_columns = false,
        add_last_update = false
      );

    }
    res.status(200).send({ message: `debug-cron-jobs` });

  }

  catch (err) {
    console.log(err);
    res.status(500).send({ error: `${err.toString()}, Spreadsheet Id: ${process.env.SYSTEM1_SPREADSHEET_ID}` });
  }

});

module.exports = route;

