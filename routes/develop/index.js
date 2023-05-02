const route = require("express").Router();
const _ = require('lodash');

const db = require('../../data/dbConfig');
const { dayBeforeYesterdayYMD, yesterdayYMD, threeDaysAgoYMD, someDaysAgoYMD, todayYMD } = require("../../common/day");
const { preferredOrder } = require("../../controllers/spreadsheetController")
const { updateSpreadsheet } = require("../../services/spreadsheetService")
const { TEMPLATE_SHEET_VALUES, TEMPLATE_ADSET_SHEET_VALUES,  sheetsArr } = require('../../constants/templateSheet');


function mergeDictionaries(list1, list2, aggregation = 'campaigns') {
  console.log("aggregation", aggregation)
  const combined = [];

  list1.forEach(dict1 => {
    // Change the match on adset vs campaign
    let match;
    aggregation === 'campaigns'
      ? match = list2.find(dict2 => dict1.tracking_field_3 === dict2.campaign_id)
      : match = list2.find(dict2 => dict1.tracking_field_2 === dict2.adset_id);

    // Old version
    // const match = list2.find(dict2 => dict1.tracking_field_3 === dict2.campaign_id);
    let combinedDict = { ...dict1 };

    // Change the delete on adset vs campaign
    aggregation === 'campaigns' ? delete combinedDict.tracking_field_3 : delete combinedDict.tracking_field_2

    // Old version
    // delete combinedDict.tracking_field_3;

    if (match) {
      combinedDict = { ...match, ...combinedDict };
    } else {
      aggregation === 'campaigns' ? combinedDict.campaign_id = dict1.tracking_field_3 : combinedDict.adset_id = dict1.tracking_field_2
      // Old version
      // combinedDict.campaign_id = dict1.tracking_field_3;
      for (const key in list2[0]) {
        if (!(key in combinedDict)) {
          combinedDict[key] = 'Missing Record';
        }
      }
    }
    combined.push(combinedDict);
  });

  list2.forEach(dict2 => {
    // Change the match on adset vs campaign
    let match;
    aggregation === 'campaigns'
      ? match = list1.find(dict1 => dict1.tracking_field_3 === dict2.campaign_id)
      : match = list1.find(dict1 => dict1.tracking_field_2 === dict2.adset_id);

    // Old version
    // const match = list1.find(dict1 => dict1.tracking_field_3 === dict2.campaign_id);
    if (!match) {
      const missingDict = { ...dict2 };
      for (const key in list1[0]) {
        if (!(key in missingDict)) {
          missingDict[key] = 'Missing Record';
        }
      }
      // Change the delete on adset vs campaign
      aggregation === 'campaigns' ? delete missingDict.tracking_field_3 : delete missingDict.tracking_field_2

      // Old version
      // delete missingDict.tracking_field_3;
      combined.push(missingDict);
    }
  });

  return combined;
}

function calculateValuesForAggSpreadsheet(data, columns, aggregation = 'campaigns') {

  const rows = data.map(item => {
    const result = {
      // facebook
      ad_account_name: item.ad_account_name,
      time_zone: item.time_zone,
      entity_name: item.entity_name,
      status: item.status,
      launch_date: item.launch_date,
      amount_spent: item.amount_spent,
      impressions: item.impressions,
      reach: null,
      frequency: null,
      link_clicks: item.link_clicks,
      cpc_link_click: item.cpc_link_click,
      clicks_all: null,
      cpc_all: item.cpc_all,
      cpm: item.cpm,
      ctr_fb: item.ctr_fb,
      results: item.results,
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
      cf_last_update: item.created_at,

      // postback_events
      pb_conversions: item.pb_conversions,
      pb_revenue: item.pb_revenue

    }

    // Change the delete on adset vs campaign
    aggregation === 'campaigns'
    ? result.campaign_id = item.campaign_id
    : result.adset_id = item.adset_id

    return preferredOrder(result, columns)
  })
  return {columns, rows}
}

const {
  aggregatePostbackConversionByTrafficReport
} = require("../../common/aggregations")

async function templateSheetFetcher(startDate, endDate, telemetry=false, sheetDropdown="campaigns") {

    const facebookDate = startDate.split(' ')[0];
    const facebookEndDate =  endDate.split(' ')[0];

    let idString; let clickflare_grouping; let selectString; let joinString; let groupBy;
    let join_source; let select_id;

    if (sheetDropdown === "campaigns") {

      idString = "campaign_id";
      clickflare_grouping = "tracking_field_3";

      selectString = `
        ad.name as ad_account_name, ad.tz_name as time_zone, fb.campaign_id as campaign_id,
        c.name as entity_name, c.status, c.created_time as launch_date,
      `
      joinString = `
        LEFT JOIN campaigns c ON fb.campaign_id = CAST(c.id as VARCHAR)
        LEFT JOIN ad_accounts ad ON ad.id = c.ad_account_id
      `
      groupBy = `
        GROUP BY ad.name, ad.tz_name, fb.campaign_id, c.name, c.status, c.created_time
      `
      join_source = `(SELECT c.id, c.name, ad.tz_name, ad.tz_offset FROM campaigns c
        LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_3 = tz.id`

      select_id = `GROUPING(td.tracking_field_3) = 1 THEN '1' ELSE td.tracking_field_3 END AS campaign_id,
      CASE WHEN GROUPING(td.tracking_field_3) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_6) END as campaign_name`

    } else if (sheetDropdown === "adsets") {

      idString = "adset_id";
      clickflare_grouping = "tracking_field_2";

      selectString = `
        ad.name as ad_account_name, ad.tz_name as time_zone,
        fb.adset_id as adset_id, ads.name as entity_name, ads.status, ads.created_time as launch_date,
      `
      joinString = `
        LEFT JOIN adsets ads ON fb.campaign_id = CAST(ads.campaign_id as VARCHAR)
        LEFT JOIN campaigns c ON fb.campaign_id = CAST(c.id as VARCHAR)
        LEFT JOIN ad_accounts ad ON ad.id = c.ad_account_id
      `
      groupBy = `
        GROUP BY ads.name, ads.status, ads.created_time, fb.adset_id, ad.name, ad.tz_name, fb.adset_id;
      `
      join_source = `(SELECT c.provider_id, c.name, ad.tz_name, ad.tz_offset FROM adsets c
        LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_2 = tz.provider_id`

      select_id = `GROUPING(td.tracking_field_2) = 1 THEN '1' ELSE td.tracking_field_2 END AS adset_id,
      CASE WHEN GROUPING(td.tracking_field_2) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_5) END as adset_name`
    }

    let query = `
      SELECT
          ${selectString}
          CAST(SUM(fb.total_spent) AS FLOAT) as amount_spent,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions,
          CAST(ROUND(SUM(fb.link_clicks), 2) AS FLOAT) as link_clicks,
          TRUNC(CASE WHEN SUM(fb.link_clicks::numeric) = 0 THEN 0 ELSE (SUM(fb.total_spent)::numeric / SUM(fb.link_clicks)::numeric) END, 3) as cpc_link_click,
          TRUNC(CASE WHEN SUM(fb.impressions::numeric) = 0 THEN 0 ELSE (SUM(fb.total_spent)::numeric / (SUM(fb.impressions::numeric) / 1000::numeric)) END, 3) as cpm,
          TRUNC(CASE WHEN SUM(fb.impressions)::numeric = 0 THEN 0 ELSE (SUM(fb.link_clicks)::numeric / SUM(fb.impressions)::numeric) END, 3) / 100 || '%' as ctr_fb,
          AVG(fb.cpc) as cpc_all,
          MAX(fb.updated_at) as fb_updated_at
      FROM facebook fb
          ${joinString}
      WHERE fb.date >= '${facebookDate}' AND fb.date <= '${facebookEndDate}'
      ${groupBy};
    `
    // console.log(query)
    // Fetch data from facebook and campaigns table
    let facebook_data = await db.raw(query)

    // Fetch data from clickflare table
    let clickflare_data = await db.raw(`
      SELECT CASE WHEN ${select_id},
        td.${clickflare_grouping} as ${clickflare_grouping},
        CAST(ROUND(SUM(td.conversion_payout), 2) AS FLOAT) as tr_revenue,
        CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as tr_visits,
        CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as tr_clicks,
        CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as tr_conversions,
        CAST(COUNT(CASE WHEN td.custom_conversion_number = 1 THEN 1 ELSE null END) AS INTEGER) as tr_searches,
        ROUND(CAST(CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS float)
        / NULLIF(CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS float), 0) * 100 as numeric), 2)  || '%' as tr_ctr,
        MAX(created_at) as created_at
      FROM tracking_data td
      LEFT JOIN ${join_source}
      WHERE td.visit_time + make_interval(hours => COALESCE(tz.tz_offset, 0))
      > '${startDate}'
      AND td.visit_time + make_interval(hours => COALESCE(tz.tz_offset, 0))
      < '${endDate}'
      AND traffic_source_id IN ('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445','622f32e17150e90012d545ec', '62f194b357dde200129b2189')
      GROUP BY GROUPING SETS (
        (),
        (td.${clickflare_grouping}, tz.tz_name)
        )
    `)

    // Fetch data from crossroads table
    let crossroads_data = await db.raw(`
      SELECT
        cr.${idString} as ${clickflare_grouping},
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
      GROUP BY cr.${idString};
    `)

    postback_query = `
      SELECT
        pb.${idString} as ${clickflare_grouping},
        CAST(COUNT(pb.event_type) AS INTEGER) as pb_conversions,
        SUM(pb.pb_value) as pb_revenue
      FROM postback_events pb
        WHERE pb.date >= '${facebookDate}' AND pb.date <= '${facebookEndDate}'
        AND pb.event_type = 'Purchase'
        AND pb.traffic_source = 'facebook'
      GROUP BY pb.${idString};
    `
    // console.log("Postback Query \n", postback_query)

    let postback_data = await db.raw(postback_query)

    // Intersection clickflare with facebook data
    const result = mergeDictionaries(clickflare_data.rows, facebook_data.rows, aggregation=sheetDropdown);
    const result2 = mergeDictionaries(crossroads_data.rows, result, aggregation=sheetDropdown);
    const result3 =  mergeDictionaries(postback_data.rows, result2, aggregation=sheetDropdown);

    if (telemetry) {
      console.log(
        " Clickflare Results", clickflare_data.rows.length, "\n",
        "Facebook Results", facebook_data.rows.length, "\n",
        "Crossroads Results", crossroads_data.rows.length, "\n",
        "No of results after merge 1", result.length, "\n",
        "No of results after merge 2", result2.length, "\n",
        "No of results after merge 3", result2.length, "\n",
        result3);
    }

    console.log("Result 1: ");
    console.log(result[0]);
    console.log("Result 2: ");
    console.log(result2[0]);
    console.log("Result 3: ");
    console.log(result3[0]);
    return result3
}

// @route     /api/debug-cron-jobs
// @desc     Runs Cron Jobs
route.get("/debug-cron-jobs", async (req, res) => {

  try {

    for (i=0; i < sheetsArr.length; i ++ ) {

      console.log("test");

      // Calculating start-date, end-date for each tab in the sheetsArr[i]
      let min_date = someDaysAgoYMD(sheetsArr[i].day - 1, null);
      let endDay = sheetsArr[i].day == 1 ? todayYMD('UTC') : yesterdayYMD(null);
      min_date = min_date + ' 00:00:00';
      endDay = endDay + ' 23:59:59';

      for ( k = 0; k < 2; k ++) {

        aggregation = k == 0 ? 'campaigns' : 'adsets';
        columnsOrder = k == 0 ? TEMPLATE_SHEET_VALUES : TEMPLATE_ADSET_SHEET_VALUES;
        sheetName = k == 0 ? sheetsArr[i].sheetName : sheetsArr[i].sheetNameByAdset;

        console.log("Updating sheet: ", sheetName, "| Aggregation: ", aggregation)

        // CAMPAIGN SHEET UPDATE!
        const data = await templateSheetFetcher(min_date, endDay, telemetry=false, sheetDropdown=aggregation)

        // Formating the spreadsheet data and sorting it.
        let aggregatedData = calculateValuesForAggSpreadsheet(data, columnsOrder, aggregation=aggregation)

        // Sort the list of dictionaries by putting those which we find in the database first
        aggregatedData.rows.sort(function(a, b) {
          // compare the "missing" attributes
          if (a.entity_name === 'Missing Record' && b.entity_name !== 'Missing Record') {
              return 1; // move 'a' to the end of the list
          } else if (a.entity_name !== 'Missing Record' && b.entity_name === 'Missing Record') {
              return -1; // move 'b' to the end of the list
          } else {
              return 0; // leave the order unchanged
          }
        });

        console.log("Aggregated Results Sorted: ");
        console.log(aggregatedData.rows[0]);

        // Updating the spreadsheet with the sorted list.
        await updateSpreadsheet(
          aggregatedData,
          {spreadsheetId: sheetsArr[i].spreadsheetId, sheetName:  k == 0 ? sheetsArr[i].sheetName : sheetsArr[i].sheetNameByAdset}, // Change sheetName to sheetNameByAdset
          predifeniedRange=`!A3:AL1000`,
          include_columns = false,
          add_last_update = false
        );

      }

    }
    res.status(200).send({ message: `debug-cron-jobs` });
  }

  catch (err) {
    console.log(err);
    res.status(500).send({ error: `${err.toString()}, Spreadsheet Id: ${process.env.SYSTEM1_SPREADSHEET_ID}` });
  }

});

const { clickflareMorningFill } = require('../../cron/clickflare-cron');
const { updateClickflareData } = require('../../services/clickflareService');

// @route     /api/clickflare-debugging
// @desc     Runs Cron Jobs
route.get("/clickflare-debugging", async (req, res) => {

  try {
    startDate = '2023-04-30 00:00:00';
    endDate = '2023-04-30 23:59:59';
    console.log("Updating Clickflare Data", "S:", startDate, "E:", endDate)
    await updateClickflareData(startDate, endDate, 'UTC');
    // let pb_data = await aggregatePostbackConversionByTrafficReport('2023-04-29', '2023-04-30', 'campaign_id', 'crossroads', 'facebook')
    // console.log(pb_data.rows)
    res.status(200).send({ message: `debug-cron-jobs` });
  }

  catch (err) {
    console.log(err);
    res.status(500).send({ error: `${err.toString()}, Spreadsheet Id: ${process.env.SYSTEM1_SPREADSHEET_ID}` });
  }

});

const { CLICKFLAREDATA_SHEET_VALUES } = require('../../constants/clickflare');
const { clickflareCampaigns } = require("../../common/aggregations/clickflare_report");
const { calculateValuesForCFSpreadsheet } = require("../../controllers/spreadsheetController");
const spreadsheets = require("../../services/spreadsheetService");

route.get("/testing-clickflare",  async (req, res) => {

  try {
    startDate = '2023-04-25 00:00:00';
    endDate = '2023-04-25 23:59:59';
    console.log("Start Date in Update CF Sheet", startDate, "End Date", endDate)
    await updateClickflareData(startDate, endDate, 'UTC');

    const spreadsheetId = '1J7-neUUgaN9rgcKFSTIJ7RHY-tlFwDLz3biD2g2M-P8'
    const sheetName = 'Testing'
    traffic_source = `('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445', '622f32e17150e90012d545ec', '62f194b357dde200129b2189')`

    const camp_data = await db.raw(`
    SELECT
      CASE WHEN GROUPING(td.tracking_field_3) = 1 THEN '1' ELSE td.tracking_field_3 END AS campaign_id,
      CASE WHEN GROUPING(td.tracking_field_3) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_6) END as campaign_name,
      CAST(ROUND(SUM(td.conversion_payout), 2) AS FLOAT) as revenue,
      CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as visits,
      CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as clicks,
      CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as conversions
      FROM tracking_data td
      WHERE td.traffic_source_id IN ${traffic_source}
      AND td.visit_time > '${startDate}' AND td.visit_time <= '${endDate}'
      GROUP BY GROUPING SETS (
        (),
        (td.tracking_field_3)
      )
      ORDER BY td.tracking_field_3 DESC
    `)

    // let camp_data = await clickflareCampaigns(startDate, endDate, 'campaign', traffic_source);
    campData = calculateValuesForCFSpreadsheet(camp_data.rows, ['campaign_id','campaign_name', ...CLICKFLAREDATA_SHEET_VALUES]);
    await spreadsheets.updateSpreadsheet(campData, {spreadsheetId, sheetName});
    res.status(200).send({ message: `debug-clickflare-fetching` });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ error: `${err.toString()}, Spreadsheet Id: ${process.env.SYSTEM1_SPREADSHEET_ID}` });
  }

})

const {
  aggregatePostbackConversionReport
} = require("../../common/aggregations/")

route.get("/testing-postback", async (req, res) => {

  let aggregated_data = await aggregatePostbackConversionReport(
    dayBeforeYesterdayYMD(null, 'UTC'),
    yesterdayYMD(null, 'UTC'),
    threeDaysAgoYMD(null, 'UTC'),
    'campaign_id',
    [''],
    'crossroads',
    'UTC'
    )
    console.log(aggregated_data)
})

module.exports = route;
