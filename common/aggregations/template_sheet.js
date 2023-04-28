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

    if (!match) {
      const missingDict = { ...dict2 };
      for (const key in list1[0]) {
        if (!(key in missingDict)) {
          missingDict[key] = 'Missing Record';
        }
      }
      // Change the delete on adset vs campaign
      aggregation === 'campaigns' ? delete missingDict.tracking_field_3 : delete missingDict.tracking_field_2

      combined.push(missingDict);
    }
  });

  return combined;
}

async function templateSheetFetcher(startDate, endDate, telemetry=false, sheetDropdown="campaigns") {

  const facebookDate = startDate.split(' ')[0];
  const facebookEndDate =  endDate.split(' ')[0];

  let idString; let clickflare_grouping; let selectString; let joinString; let groupBy;

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
    SELECT
      td.${clickflare_grouping} as ${clickflare_grouping},
      CAST(ROUND(SUM(td.conversion_payout), 2) AS FLOAT) as tr_revenue,
      CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as tr_visits,
      CAST(COUNT(CASE WHEN td.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as tr_clicks,
      CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS INTEGER) as tr_conversions,
      ROUND(CAST(CAST(COUNT(CASE WHEN td.custom_conversion_number = 2 THEN 1 ELSE null END) AS float)
      / CAST(COUNT(CASE WHEN td.event_type = 'visit' THEN 1 ELSE null END) AS float) * 100 as numeric), 2)  || '%' as tr_ctr,
      MAX(created_at) as created_at
    FROM tracking_data td
    WHERE td.visit_time > '${startDate}' AND td.visit_time < '${endDate}' AND traffic_source_id IN ('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445','622f32e17150e90012d545ec', '62f194b357dde200129b2189')
    GROUP BY td.${clickflare_grouping};
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

  // Intersection clickflare with facebook data
  const result = mergeDictionaries(clickflare_data.rows, facebook_data.rows, aggregation=sheetDropdown);
  const result2 = mergeDictionaries(crossroads_data.rows, result, aggregation=sheetDropdown);

  if (telemetry) {
    console.log(
      " Clickflare Results", clickflare_data.rows.length, "\n",
      "Facebook Results", facebook_data.rows.length, "\n",
      "Crossroads Results", crossroads_data.rows.length, "\n",
      "No of results after merge 1", result.length, "\n",
      "No of results after merge 2", result2.length, "\n"
    );
    console.log("Result 1: ");
    console.log(result[0]);
    console.log("Result 2: ");
    console.log(result2[0]);
  }

  return result2
}

module.exports = {
  templateSheetFetcher,
}
