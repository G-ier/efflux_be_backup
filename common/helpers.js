const db = require("../data/dbConfig");
const axios = require("axios");
const _ = require("lodash");
const moment = require("moment-timezone");
const { FB_API_URL } = require("../constants/facebook");

const { get, findBy, findAllBy, add, remove, removeItems, update, removeAllOnDate } = require('./models');
const {tomorrowYMD} = require('../common/day');

const aggregateFacebookAnd = (
  start_date,
  end_date,
  campaign_id,
  mediaBuyer
) => {
  if (mediaBuyer && mediaBuyer !== "admin") {
    return db.raw(`
    WITH agg_cr AS (
      SELECT DISTINCT ON(ad_id) ad_id,
      total_revenue  as cr_revenue,
      total_searches as cr_searches,
      total_lander_visits as cr_lander_visits,
      total_revenue_clicks as cr_revenue_clicks,
      total_visitors as cr_visitors,
      total_tracked_visitors as cr_tracked_visitors
      FROM crossroads cr
      WHERE  cr.date >  '${moment(start_date)
        .tz("America/Los_Angeles")
        .format("YYYY-MM-DD")}'
      AND   cr.date <= '${moment(end_date)
        .tz("America/Los_Angeles")
        .format("YYYY-MM-DD")}'
      AND cr.campaign_id = '${campaign_id}'
      GROUP BY cr.ad_id, cr.date, total_revenue, total_searches, total_lander_visits, total_revenue_clicks, total_visitors, total_tracked_visitors
    ), agg_fb AS (
        SELECT DISTINCT ON(fb.ad_id, fb.date) fb.ad_id, fb.campaign_name, fb.date,
        SUM(fb.total_spent) as total_spent,
        CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
        SUM(fb.cpc) as cpc
        FROM facebook fb
        WHERE  fb.date >  '${moment(start_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        AND  fb.date <= '${moment(end_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        AND fb.campaign_id = '${campaign_id}'
        GROUP BY fb.ad_id, fb.date, fb.campaign_name
    )
    SELECT * FROM agg_cr FULL OUTER JOIN agg_fb USING (ad_id)
    WHERE agg_fb.campaign_name ~ '^${mediaBuyer.toUpperCase()}'
`);
  }
  return db.raw(`
      WITH agg_cr AS (
        SELECT DISTINCT ON(ad_id) ad_id,
        total_revenue  as cr_revenue,
        total_searches as cr_searches,
        total_lander_visits as cr_lander_visits,
        total_revenue_clicks as cr_revenue_clicks,
        total_visitors as cr_visitors,
        total_tracked_visitors as cr_tracked_visitors
        FROM crossroads cr
        WHERE  cr.date >  '${moment(start_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        AND   cr.date <= '${moment(end_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        AND cr.campaign_id = '${campaign_id}'
        GROUP BY cr.ad_id, cr.date, total_revenue, total_searches, total_lander_visits, total_revenue_clicks, total_visitors, total_tracked_visitors
      ), agg_fb AS (
          SELECT DISTINCT ON(fb.ad_id, fb.date) fb.ad_id, fb.campaign_name, fb.date,
          SUM(fb.total_spent) as total_spent,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          SUM(fb.cpc) as cpc
          FROM facebook fb
          WHERE  fb.date >  '${moment(start_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          AND  fb.date <= '${moment(end_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          AND fb.campaign_id = '${campaign_id}'
          GROUP BY fb.ad_id, fb.date, fb.campaign_name
      )
      SELECT * FROM agg_cr FULL OUTER JOIN agg_fb USING (ad_id)
  `);
};

const aggregateCampaingsFacebookAndCrossroads = async (
  start_date,
  end_date,
  mediaBuyer
) => {
  if (mediaBuyer && mediaBuyer !== "admin") {
    return db.raw(`
    WITH agg_cr AS (
          SELECT DISTINCT ON(cr.campaign_id) cr.campaign_id, cr.campaign_name as cr_campaign_name,
          SUM(cr.total_revenue) as cr_revenue,
          CAST(SUM(cr.total_searches) AS INTEGER) as cr_searches,
          CAST(SUM(cr.total_lander_visits) AS INTEGER) as cr_lander_visits,
          CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_revenue_clicks,
          CAST(SUM(cr.total_visitors) AS INTEGER) as cr_visitors,
          CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as cr_tracked_visitors
          FROM crossroads cr
          WHERE  cr.date >  '${moment(start_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          AND   cr.date <= '${moment(end_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          GROUP BY cr.campaign_id, cr.campaign_name
        ), agg_fb AS (
            SELECT DISTINCT ON(fb.campaign_id) fb.campaign_id, fb.campaign_name,
            SUM(fb.total_spent) as total_spent,
            CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
            SUM(fb.cpc) as cpc
            FROM facebook fb
            WHERE  fb.date >  '${moment(start_date)
              .tz("America/Los_Angeles")
              .format("YYYY-MM-DD")}'
            AND  fb.date <= '${moment(end_date)
              .tz("America/Los_Angeles")
              .format("YYYY-MM-DD")}'
            GROUP BY fb.campaign_id, fb.campaign_name
        )
        SELECT SUM(total_spent) as total_spent,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        SUM(cpc) as cpc,
        SUM(agg_cr.cr_revenue) as cr_revenue,
        CAST(SUM(agg_cr.cr_searches) AS INTEGER) as cr_searches,
        CAST(SUM(agg_cr.cr_lander_visits) AS INTEGER) as cr_lander_visits,
        CAST(SUM(agg_cr.cr_revenue_clicks) AS INTEGER) as cr_revenue_clicks,
        CAST(SUM(agg_cr.cr_visitors) AS INTEGER) as cr_visitors,
        CAST(SUM(agg_cr.cr_tracked_visitors) AS INTEGER) as cr_tracked_visitors,
        agg_fb.campaign_id,
        agg_fb.campaign_name
        FROM agg_fb
        FULL OUTER JOIN agg_cr ON agg_fb.campaign_id = agg_cr.campaign_id
        WHERE agg_fb.campaign_name ~ '^${mediaBuyer.toUpperCase()}'
        GROUP BY agg_fb.campaign_id, agg_fb.campaign_name
    `);
  }

  return db.raw(`
      WITH agg_cr AS (
        SELECT DISTINCT ON(cr.campaign_id) cr.campaign_id,
        SUM(cr.total_revenue) as cr_revenue,
        CAST(SUM(cr.total_searches) AS INTEGER) as cr_searches,
        CAST(SUM(cr.total_lander_visits) AS INTEGER) as cr_lander_visits,
        CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_revenue_clicks,
        CAST(SUM(cr.total_visitors) AS INTEGER) as cr_visitors,
        CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as cr_tracked_visitors
        FROM crossroads cr
        WHERE  cr.date >  '${moment(start_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        AND   cr.date <= '${moment(end_date)
          .tz("America/Los_Angeles")
          .format("YYYY-MM-DD")}'
        GROUP BY cr.campaign_id
      ), agg_fb AS (
          SELECT DISTINCT ON(fb.campaign_id) fb.campaign_id, fb.campaign_name,
          SUM(fb.total_spent) as total_spent,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          SUM(fb.cpc) as cpc
          FROM facebook fb
          WHERE  fb.date >  '${moment(start_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          AND  fb.date <= '${moment(end_date)
            .tz("America/Los_Angeles")
            .format("YYYY-MM-DD")}'
          GROUP BY fb.campaign_id, fb.campaign_name
      )
      SELECT *
      FROM agg_fb
      FULL OUTER JOIN agg_cr ON agg_fb.campaign_id = agg_cr.campaign_id
      ORDER BY agg_fb.campaign_name ASC
  `);
};

const getTotalByDateAndCampaignId = (day, campaign_id) => {
  return db.raw(`
    WITH agg_cr AS (
      SELECT DISTINCT ON(cr.campaign_id) cr.campaign_id,
      SUM(cr.total_revenue) as cr_revenue,
      CAST(SUM(cr.total_searches) AS INTEGER) as cr_searches,
      CAST(SUM(cr.total_lander_visits) AS INTEGER) as cr_lander_visits,
      CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_revenue_clicks,
      CAST(SUM(cr.total_visitors) AS INTEGER) as cr_visitors,
      CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as cr_tracked_visitors
      FROM crossroads cr
      WHERE  cr.date = '${day}'
      GROUP BY cr.campaign_id
    ), agg_fb AS (
        SELECT DISTINCT ON(fb.campaign_id, fb.date) fb.campaign_id, fb.campaign_name, fb.date,
        SUM(fb.total_spent) as total_spent,
        CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
        SUM(fb.cpc) as cpc
        FROM facebook fb
        WHERE  fb.date = '${day}'
        GROUP BY fb.campaign_id, fb.campaign_name, fb.date
    )
    SELECT *
    FROM agg_fb
    FULL OUTER JOIN agg_cr ON agg_fb.campaign_id = agg_cr.campaign_id
    WHERE agg_fb.campaign_id = '${campaign_id.toString()}'
    ORDER BY agg_fb.campaign_name ASC
  `);
};

const selectLastItemEntered = (tbl) =>
  db(tbl).orderBy("created_at", "desc").limit(1);

const findInsertedBetween = (tbl, start_date, end_date) => {
  return db(tbl)
    .where(
      "date",
      ">",
      moment(start_date).tz("America/Los_Angeles").format("YYYY-MM-DD")
    )
    .andWhere(
      "date",
      "<=",
      moment(end_date).tz("America/Los_Angeles").format("YYYY-MM-DD")
    );
};

function aggregate(data, keyFields, accumulatorFn) {
  const createNewObj = (ref, fields) => {
    return fields.reduce((result, key) => {
      return Object.assign(result, { [key]: ref[key] });
    }, {});
  };
  return Object.values(
    data.reduce((result, object, index, ref) => {
      let key = keyFields.map((key) => object[key]).join("");
      let val = result[key] || createNewObj(object, keyFields);
      return Object.assign(result, { [key]: accumulatorFn(val, object) });
    }, {})
  );
}

const handleAds = (date, getActualData) => {
  getActualData.map((d) => {
    const split = d.tg2.split("_");
    d.traffic_source = split[0];
    d.campaign_id = split[1];
    d.ad_id = split[2];
    d.website = split[3];
    return d;
  });

  const adResults = getActualData.reduce((acc, item) => {
    if (!acc[item.ad_id]) acc[item.ad_id] = item;
    acc[item.ad_id].publisher_revenue_amount += item.publisher_revenue_amount;
    acc[item.ad_id].lander_searches += item.lander_searches;
    acc[item.ad_id].lander_visitors += item.lander_visitors;
    acc[item.ad_id].revenue_clicks += item.revenue_clicks;
    acc[item.ad_id].total_visitors += item.total_visitors;
    acc[item.ad_id].tracked_visitors += item.tracked_visitors;
    return acc;
  }, {});

  removeItems(date, "crossroads_ads").then(() => {
    console.log("CLEARED CROSSROADS ADS");
    Object.keys(adResults).map(async (key) => {
      const object = adResults[key];
      const mapObject = {
        date: date,
        hour_fetched: object.hour,
        campaign_name: object.campaign__name,
        campaign_id: object.campaign_id,
        ad_id: object.ad_id,
        total_revenue: object.publisher_revenue_amount,
        total_searches: object.lander_searches,
        total_lander_visits: object.lander_visitors,
        total_revenue_clicks: object.revenue_clicks,
        total_visitors: object.total_visitors,
        total_tracked_visitors: object.tracked_visitors,
      };

      add("crossroads_ads", mapObject).then(([id]) => {});
    });
  });
};

const getAndPrepareDataByAdId = async (response, start_date, end_date) => {
  if (start_date && end_date) {
    const crossroadsData = await findInsertedBetween(
      "crossroads",
      start_date,
      end_date
    );

    response.json(crossroadsData);
  } else {
    const crossroads = await get("crossroads");
    return response.json(crossroads);
  }
};

const addFacebookData = async (result, date) => {
  removeAllOnDate("facebook", date)
    .then((deleteOlderData) => {
      console.log(
        "DELETING",
        `${deleteOlderData.rowCount} rows on date  ${date}`
      );

      result.map(async (res) => {
        const [insertFacebook] = await add("facebook", {
          date: date,
          campaign_name: res["campaign_name"],
          campaign_id: res["campaign_id"],
          ad_id: res["ad_id"],
          total_spent: res["spend"],
          link_clicks: res["inline_link_clicks"],
          cpc: res["cpc"],
          reporting_currency: res["account_currency"],
        });
      });
    })
    .then(() => {
      console.log(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);
    })
    .then(async () => {
      return await get("facebook");
    });
};
/******************************* SERVICES MOVED HERE *************************************************/

const getLongToken = async (accessToken) => {
  const longToken = await axios
    .get(
      `${FB_API_URL}oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${accessToken} `
    )
    .catch((err) => console.log("error fetching ltt ", err));
  return longToken.data.access_token;
};

const updateLongToken = async (userId, longToken) => {
  await db("users").where("fbID", "=", userId).returning("name").update({
    token: longToken,
  });
  //the following is for verification that the above works
  db("users")
    .where({ fbID: userId })
    .then((res) => console.log("result ", res))
    .catch((err) => console.log("err", err));
};
/******************************* FB STUFF ADDED HERE *************************************************/

const getFBAdAccts = async (userId, token) => {
  //replace the hard-coded userid below with userId once we decide best way to handle that
  const accountArray = await axios
    .get(
      `${FB_API_URL}${userId}/adaccounts?fields=amount_spent,name,balance&access_token=${token}&limit=10000`
    )
    .then((res) => {
      return res;
    })
    .catch((err) =>
      console.log("ERROR GETTING FACEBOOK AD ACCOUNTS", err.response.data.error)
    );

  const accountIds = accountArray.data.data;
  //format the data returned by request to a nice array of ids
  const accountIdArray = accountIds.map((element) => {
    return element.id;
  });

  console.log(accountIdArray);
  return accountIdArray;
};

//FB's Insights API will not return certain keys if there is no value associated with them - e.g.,
//it will not return "spend":0 if no spend, it just won't include the key 'spend' with the
//return object. To avoid problems when inserting into DB, this function adds the keys back
//to the object with appropiate values.
const cleanInsightsData = (result) => {
  if (result[0]["campaign_name"] === undefined)
    result[0]["campaign_name"] = "No Name";
  if (result[0]["spend"] === undefined) result[0]["spend"] = 0;
  if (result[0]["inline_link_clicks"] === undefined)
    result[0]["inline_link_clicks"] = 0;
  if (!result[0]["cpc"] === undefined) result[0]["cpc"] = 0;
};

const getAdInsights = async (token, adArray, date) => {
  let insightsArray = [];

  for (const adSetId of adArray) {
    const data = await axios
      .get(
        `${FB_API_URL}${adSetId}/insights?&fields=account_id,ad_id,adset_id,inline_link_clicks,campaign_id,date_start,date_stop,impressions,spend,cpc,ad_name,adset_name,campaign_name,account_currency&level=ad&breakdowns=&date_preset=${date}&access_token=${token}&limit=1000`
      )
      .then((res) => {
        console.log(res.data.data);
        return res;
      })
      .catch((err) => console.log("err ", err));
    let result = data.data.data;
    if (result.length == 0) continue;

    cleanInsightsData(result);
    insightsArray = insightsArray.concat(result);
  }

  return insightsArray;
};

const addFacebookAPIData = async (result, date) => {
  removeAllOnDate("facebook", date)
    .then((deleteOlderData) => {
      console.log(
        "DELETING",
        `${deleteOlderData.rowCount} rows on date  ${date}`
      );

      result.map(async (res) => {
        const [insertFacebook] = await add("facebook", {
          date: date,
          campaign_name: res["campaign_name"],
          campaign_id: res["campaign_id"],
          ad_id: res["ad_id"],
          total_spent: res["spend"],
          link_clicks: res["inline_link_clicks"],
          cpc: res["cpc"],
          reporting_currency: res["account_currency"],
        });
      });
    })
    .then(() => {
      console.log(`DONE ADDING FACEBOOK DATA 🎉 for ${date}`);
    })
    .then(async () => {
      return await get("facebook");
    });
};

function processDateHoles(rows, startDate, endDate) {
  const dates = [];
  let date = startDate;
  while (date !== endDate) {
    date = tomorrowYMD(date);
    dates.push(date);
  }

  return dates.map((date) => {
    const item = rows.find((row) => row.date === date || row.date2 === date);
    return item ?? {date};
  });
}

const hourlyKeys = ['revenue', 'searches', 'conversions', 'uniq_conversions', 'visitors', 'tracked_visitors', 'spend', 'link_clicks', 'ts_conversions', 'impressions', 'pb_conversions', 'pb_uniq_conversions', 'pb_searches', 'pb_impressions']
function reduceHourlyData(rows) {
  return rows.reduce((acc, row) => {
    hourlyKeys.forEach((key) => {
      if (row[key] === undefined) {
        return;
      }
      const prev = acc[key] || 0;
      acc[key] = prev + row[key];
    })
    return acc;
  }, {})
}

function processHourlyData(rows) {
  const hoursMap = _.groupBy(rows, (row) => row.hour || row.hour2 || 0);

  const resultMap = _.mapValues(hoursMap, (dateRows, hour) => {
    const datesMap = _.groupBy(dateRows, (row) => row.date || row.date2);

    const dates = _.map(datesMap, (items, date) => {
      return {
        date,
      ...reduceHourlyData(items)
      }
    });

    return {
      ...reduceHourlyData(dates),
      hour: parseInt(hour, 10),
      dates,
    }
  });

  const hourly = Array.from({ length: 25 }, (_, i) => i).map((hour) => {
    return resultMap[hour] || hour !== 24  && { hour, cpc: 0 } || null
  })

  if (!hourly[24]) {
    hourly.pop()
  }

  return hourly;
}

/******************************* NEW FB STUFF ENDS HERE *************************************************/

module.exports = {
  get,
  findBy,
  findAllBy,
  add,
  remove,
  removeItems,
  update,
  selectLastItemEntered,
  findInsertedBetween,
  removeAllOnDate,
  aggregateFacebookAnd,
  aggregateCampaingsFacebookAndCrossroads,
  aggregate,
  getAndPrepareDataByAdId,
  getLongToken,
  updateLongToken,
  addFacebookData,
  addFacebookAPIData,
  getTotalByDateAndCampaignId,
  processDateHoles,
  processHourlyData
};
