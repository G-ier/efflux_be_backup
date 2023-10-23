// Third party imports
const _                                   = require("lodash");

// Local application imports
const DatabaseRepository                  = require("../../../shared/lib/DatabaseRepository");
const { isNotNumeric }                    = require("../../../shared/helpers/Utils");

class FunnelFluxRepository {

  constructor(database) {
    this.database = database || new DatabaseRepository();
  }

  async generateFunnelIdCampaignIdTrafficSourceIdSpendMap(startDate, endDate, trafficSource) {

    console.log(`
      FUNNEL ID CAMPAIGN ID MAP
      -------------------------
      startDate       : ${startDate}
      endDate         : ${endDate}
      trafficSource   : ${trafficSource}
    `)

    const query = `
      WITH funnel_id_campaign_id_link AS (
        SELECT
          funnel_id,
          campaign_id
        FROM sedo
        WHERE funnel_id != '' AND traffic_source = '${trafficSource}'
        GROUP BY funnel_id, campaign_id
      ), campaign_id_spend AS (
        SELECT
          campaign_id,
          SUM(total_spent) as spend
        FROM tiktok
        WHERE tiktok.date > '${startDate}' AND tiktok.date <= '${endDate}'
        GROUP BY campaign_id
      )

      SELECT
        fidcid.funnel_id,
        f_id_ts_is.funnel_name,
        f_id_ts_is.traffic_source_id,
        f_id_ts_is.traffic_source_name,
        COALESCE(fidcid.campaign_id, cids.campaign_id) as campaign_id,
        cids.spend
      FROM funnel_id_campaign_id_link fidcid
      JOIN campaign_id_spend cids ON fidcid.campaign_id = cids.campaign_id
      JOIN funnel_flux_funnel_id_traffic_source_id f_id_ts_is ON f_id_ts_is.funnel_id = fidcid.funnel_id
      ORDER BY cids.spend DESC;
    `;

    const results = await this.database.raw(query)

    console.log(`Updating ${results.rows.length} traffic segments in the Funnel Flux API`)
    console.log(results.rows)

    return results.rows
  }

  parseFunnelFluxAPIData(funnelTrafficSourceLink, includeDateMatchingIdentifier=false) {

    // FUNNEL FLUX URL TRACKING MAPPINGS
    // campaign_id : tiktok -> campaign | facebook -> campaign
    // adset_id : tiktok ->  c1 | facebook -> c2
    // a_id : tiktok ->  c2 | facebook -> c1
    // trafficSource : tiktok -> c5 | facebook -> c9

    const trafficSource =
      funnelTrafficSourceLink.attributes[3].value.includes("tiktok") ? "tiktok" :
      funnelTrafficSourceLink.attributes[4].value.includes("facebook") ? "facebook" :
      'Unkown'

    let campaign_id = funnelTrafficSourceLink.attributes[0].value;
    let adset_id = trafficSource === "tiktok" ? funnelTrafficSourceLink.attributes[1].value : funnelTrafficSourceLink.attributes[2].value;
    adset_id = adset_id ? adset_id.split("?")[0] : ''
    let ad_id = trafficSource === "tiktok" ? funnelTrafficSourceLink.attributes[2].value : funnelTrafficSourceLink.attributes[1].value;
    ad_id = ad_id ? ad_id.split("?")[0] : ''

    if (isNotNumeric(campaign_id)) campaign_id = 'Unkown';
    if (isNotNumeric(adset_id)) adset_id = 'Unkown';
    if (isNotNumeric(ad_id)) ad_id = 'Unkown';

    // Convert timestamp to SEDO timezone
    const timeStamp = funnelTrafficSourceLink.attributes[5].id;
    let [date, hour] = timeStamp.split("T");
    hour = hour.slice(0, 2);

    const domain = funnelTrafficSourceLink.attributes[6].value;
    const result =  {
      // Attributes
      date: date,
      hour: +(hour.startsWith("0") ? hour.replace("0", "") : hour),
      domain: domain,
      traffic_source: trafficSource,
      campaign_id,
      adset_id,
      ad_id,

      // Metrics
      pb_visits: funnelTrafficSourceLink.offerViews,
      pb_conversions: funnelTrafficSourceLink.conversions,
      pb_revenue: funnelTrafficSourceLink.revenue ? parseFloat(funnelTrafficSourceLink.revenue) : 0,
      revenue: funnelTrafficSourceLink.revenue ? parseFloat(funnelTrafficSourceLink.revenue) : 0,

      // Identifiers
      unique_identifier: `${campaign_id}-${adset_id}-${ad_id}-${date}-${hour}`
    };

    if (includeDateMatchingIdentifier) result.date_level_matching_identifier = `${campaign_id}-${adset_id}-${ad_id}-${date}`;
    return result;
  }
}

module.exports = FunnelFluxRepository;
