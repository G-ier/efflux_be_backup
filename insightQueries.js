const db              = require('./data/dbConfig');

const trafficSource = 'facebook'
const startDate       = '2023-07-19'
const endDate         = '2023-07-26'
const mediaBuyer      = 'Crossroads'
const adAccountId     = '23855155642170044'
const query           = 'crossroads'

async function dateAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = query
  ? `AND campaign_name LIKE '%${query}%'`
  : '';

  const query = `
    SELECT
      date,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY date
    ORDER BY date;
  `
  const { rows } = await db.raw(query)
  console.log(rows)
  return rows

}

// dateAggregation(trafficSource)

async function hourAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = query
  ? `AND campaign_name LIKE '%${query}%'`
  : '';

  const query = `
    SELECT
      hour,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY hour
    ORDER BY hour;
  `

  const { rows } = await db.raw(query)
  console.log(rows)
  return rows

}

// hourAggregation(trafficSource)

async function campaignsAggregation(startDate, endDate, trafficSource, mediaBuyer, adAccountId, query) {

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
  ? `AND user_id = ${mediaBuyer}`
  : '';

  const adAccountCondition = adAccountId
  ? `AND ad_account_id = ${adAccountId}`
  : '';

  const queryCondition = query
  ? `AND campaign_name LIKE '%${query}%'`
  : '';

  const query = `
    SELECT
      campaign_id,
      campaign_name,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}' AND traffic_source = '${trafficSource}'
      ${mediaBuyerCondition}
      ${adAccountCondition}
      ${queryCondition}
    GROUP BY campaign_id, campaign_name
    ORDER BY SUM(revenue) DESC;
  `
  const { rows } = await db.raw(query)
  console.log(rows)
  return rows

}

// campaignsAggregation(trafficSource)

const campaignId = '23855155642170044'

async function campaignsAggregationByAdset(startDate, endDate, campaignId) {

  const query = `
    SELECT
      adset_id,
      adset_name,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY adset_id, adset_name
    ORDER BY SUM(revenue) DESC;
  `
  const { rows } = await db.raw(query)
  console.log(rows)
  return rows
}

// campaignsAggregationByAdset(campaignId)

async function campaignsAggregationByDate(startDate, endDate, campaignId) {

  const query = `
    SELECT
      date,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY date
    ORDER BY SUM(revenue) DESC;
  `
  const { rows } = await db.raw(query)
  console.log(rows)
  return rows
}

// campaignsAggregationByDate(campaignId)

async function campaignsAggregationByHour(startDate, endDate, campaignId) {

  const query = `
    SELECT
      hour,
      SUM(spend) as spend,
      SUM(spend_plus_fee) as spend_plus_fee,
      SUM(revenue) as revenue
    FROM insights
    WHERE date > '${startDate}' AND date <= '${endDate}'
    AND campaign_id = '${campaignId}'
    GROUP BY hour
    ORDER BY hour;
  `
  const { rows } = await db.raw(query)
  console.log(rows)
  return rows
}

campaignsAggregationByHour(campaignId)
