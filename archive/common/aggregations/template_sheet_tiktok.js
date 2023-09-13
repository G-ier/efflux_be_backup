const db = require("../../data/dbConfig");

function mergeDictionaries(list1, list2, aggregation = 'campaigns') {

  console.log("aggregation", aggregation)
  const combined = [];

  list1.forEach(dict1 => {
    // Change the match on adset vs campaign
    let match;
    aggregation === 'campaigns'
      ? match = list2.find(dict2 => dict1.tracking_field_3 === dict2.campaign_id)
      : match = list2.find(dict2 => dict1.tracking_field_2 === dict2.adset_id);


    let combinedDict = { ...dict1 };

    // Change the delete on adset vs campaign
    aggregation === 'campaigns' ? delete combinedDict.tracking_field_3 : delete combinedDict.tracking_field_2

    if (match) {
      combinedDict = { ...match, ...combinedDict };
    } else {
      aggregation === 'campaigns' ? combinedDict.campaign_id = dict1.tracking_field_3 : combinedDict.adset_id = dict1.tracking_field_2
      for (const key in list2[0]) {
        if (!(key in combinedDict)) {
          combinedDict[key] = 'N/A';
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

    if (!match) {
      const missingDict = { ...dict2 };
      for (const key in list1[0]) {
        if (!(key in missingDict)) {
          missingDict[key] = 'N/A';
        }
      }
      // Change the delete on adset vs campaign
      aggregation === 'campaigns' ? delete missingDict.tracking_field_3 : delete missingDict.tracking_field_2

      combined.push(missingDict);
    }
  });

  return combined;
}

async function tikTokTemplateSheetFetcher(startDate, endDate, telemetry=false, sheetDropdown="campaigns") {

  const facebookDate = startDate.split(' ')[0];
  const facebookEndDate =  endDate.split(' ')[0];

  let idString; let clickflare_grouping; let selectString; let joinString; let groupBy;
  let join_source; let select_id;

  if (sheetDropdown === "campaigns") {

    idString = "campaign_id";
    clickflare_grouping = "tracking_field_3";

    selectString = `
      ad.name as ad_account_name, ad.tz_name as time_zone, tt.campaign_id as campaign_id,
      c.name as entity_name, c.status,
      TO_CHAR(c.created_time::date, 'mm/dd/yy') as launch_date,
      CASE WHEN MAX(c.daily_budget) != '' THEN MAX(c.daily_budget)::integer ELSE 0 END  as daily_budget,
    `
    joinString = `
      LEFT JOIN campaigns c ON tt.campaign_id = CAST(c.id as VARCHAR)
      LEFT JOIN ad_accounts ad ON ad.id = c.ad_account_id
    `
    groupBy = `
      GROUP BY ad.name, ad.tz_name, tt.campaign_id, c.name, c.status, c.created_time
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
      tt.adset_id as adset_id, ads.name as entity_name, ads.status,
      TO_CHAR(ads.created_time::date, 'mm/dd/yy') as launch_date,
      CASE WHEN MAX(ads.daily_budget) != '' THEN MAX(ads.daily_budget)::integer ELSE 0 END  as daily_budget,
    `
    joinString = `
      LEFT JOIN adsets ads ON tt.campaign_id = CAST(ads.campaign_id as VARCHAR)
      LEFT JOIN campaigns c ON tt.campaign_id = CAST(c.id as VARCHAR)
      LEFT JOIN ad_accounts ad ON ad.id = c.ad_account_id
    `
    groupBy = `
      GROUP BY ads.name, ads.status, ads.created_time, tt.adset_id, ad.name, ad.tz_name, tt.adset_id;
    `
    join_source = `(SELECT c.provider_id, c.name, ad.tz_name, ad.tz_offset FROM adsets c
      LEFT JOIN ad_accounts ad ON c.ad_account_id = ad.id) tz ON td.tracking_field_2 = tz.provider_id`

    select_id = `GROUPING(td.tracking_field_2) = 1 THEN '1' ELSE td.tracking_field_2 END AS adset_id,
    CASE WHEN GROUPING(td.tracking_field_2) = 1  THEN 'TOTAL' ELSE MIN(td.tracking_field_5) END as adset_name`
  }

  let query = `
    SELECT
        ${selectString}
        ROUND(CAST(SUM(tt.total_spent) AS numeric), 2) as amount_spent,
        CAST(SUM(tt.impressions) AS INTEGER) as impressions,
        SUM(tt.clicks) as clicks,
        0 as link_clicks,
        0 as cpc_link_click,
        ROUND(CASE WHEN SUM(tt.impressions::numeric) = 0 THEN 0 ELSE (SUM(tt.total_spent)::numeric / (SUM(tt.impressions::numeric) / 1000::numeric)) END, 2) as cpm,
        ROUND(CASE WHEN SUM(tt.clicks)::numeric = 0 THEN 0 ELSE (SUM(tt.clicks)::numeric / SUM(tt.impressions)::numeric) * 100 END, 2) || '%' as ctr_fb,
        ROUND(CASE WHEN SUM(tt.clicks::numeric) = 0 THEN 0 ELSE (SUM(tt.total_spent)::numeric / SUM(tt.clicks)::numeric) END, 2) as cpc_all,
        TO_CHAR(MAX(tt.updated_at), 'dd/HH24:MI') as fb_updated_at
    FROM tiktok tt
        ${joinString}
    WHERE tt.date >= '${facebookDate}' AND tt.date <= '${facebookEndDate}'
    ${groupBy};
  `
  // console.log(query)
  // Fetch data from facebook and campaigns table
  let tiktok_data = await db.raw(query)

  // Fetch data from clickflare table
  let clickflare_data = await db.raw(`
    SELECT CASE WHEN ${select_id},
      td.${clickflare_grouping} as ${clickflare_grouping},
      CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as tr_visits,
      CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as tr_clicks,
      CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as tr_conversions,
      CAST(COUNT(CASE WHEN td.custom_conversion_number = 1 THEN 1 ELSE null END) AS INTEGER) as tr_searches,
      ROUND(CAST(CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS float)
      / NULLIF(CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS float), 0) * 100 as numeric), 2)  || '%' as tr_ctr,
      TO_CHAR(MAX(created_at), 'dd/HH24:MI') as created_at
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
      ROUND(SUM(total_revenue)::numeric, 2) as publisher_revenue,
      TO_CHAR(MAX(updated_at), 'dd/HH24:MI') as cr_updated_at
    FROM crossroads cr
    WHERE date(date) >= date('${startDate}') AND date(date) <= '${endDate}' AND traffic_source = 'tiktok'
    GROUP BY cr.${idString};
  `)

  postback_query = `
    SELECT
      pb.${idString} as ${clickflare_grouping},
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
    FROM postback_events pb
      WHERE pb.date >= '${facebookDate}' AND pb.date <= '${facebookEndDate}'
      AND pb.traffic_source = 'tiktok'
      AND network = 'crossroads'
      AND pb.${idString} != ''
    GROUP BY pb.${idString};
  `
  // console.log("Postback Query \n", postback_query)

  let postback_data = await db.raw(postback_query)

  // Intersection clickflare with facebook data
  const result = mergeDictionaries(clickflare_data.rows, tiktok_data.rows, aggregation=sheetDropdown);
  const result2 = mergeDictionaries(crossroads_data.rows, result, aggregation=sheetDropdown);
  const result3 =  mergeDictionaries(postback_data.rows, result2, aggregation=sheetDropdown);

  if (telemetry) {
    console.log(
      " Clickflare Results", clickflare_data.rows.length, "\n",
      "TikTok Results", tiktok_data.rows.length, "\n",
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

const main = async () => {
  const result = await tikTokTemplateSheetFetcher('2023-06-19', '2023-06-26', telemetry=true, sheetDropdown='campaigns');
}

// main();

module.exports = {
  tikTokTemplateSheetFetcher,
}
