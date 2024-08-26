// Third party imports
const _ = require('lodash');

// Local application imports
const campaignAdsets = require('../reports/campaignAdsets');
const campaignDaily = require('../reports/campaignDaily');
const campaignHourly = require('../reports/campaignHourly');
const revealBotSheets = require('../reports/revealBotSheets');
const trafficSourceNetowrkCampaignsAdsetsStats = require('../reports/trafficSourceNetowrkCampaignsAdsetsStats');
const trafficSourceNetworkCampaignsStats = require('../reports/trafficSourceNetworkCampaignsStats');
const trafficSourceNetworkDaily = require('../reports/trafficSourceNetworkDaily');
const trafficSourceNetworkHourly = require('../reports/trafficSourceNetworkHourly');
const compileAggregates = require('../reports/compileAggregates');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const adsetsByCampaignId = require('../reports/adsetsByCampaignId');
const ClickhouseRepository = require('../../../shared/lib/ClickhouseRepository');
const { cleanData, formatDateToISO } = require('../utils');

class AggregatesRepository {

  constructor(database) {
    this.tableName = 'insights';
    this.database = database || new DatabaseRepository();
    this.clickhouse = new ClickhouseRepository();
  }

  async revealBotSheets(
    startDate,
    endDate,
    aggregateBy = 'campaigns',
    trafficSource = 'facebook',
    network = 'crossroads',
    today = false,
  ) {
    return await revealBotSheets(
      this.database,
      startDate,
      endDate,
      aggregateBy,
      trafficSource,
      network,
      today,
    );
  }

  async campaignAdsets(params) {
    const { startDate, endDate, campaignId, orgId } = params;
    // Check if campaignId is an array
    if (Array.isArray(campaignId)) {
      return await adsetsByCampaignId(this.database, startDate, endDate, campaignId);
    } else {
      return await campaignAdsets(this.database, startDate, endDate, campaignId, orgId);
    }
  }

  async campaignDaily(params) {
    const { startDate, endDate, campaignId } = params;
    return await campaignDaily(this.database, startDate, endDate, campaignId);
  }

  async campaignHourly(params) {
    const { startDate, endDate, campaignId, orgId } = params;
    return await campaignHourly(this.database, startDate, endDate, campaignId, orgId);
  }

  async trafficSourceNetowrkCampaignsAdsetsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId } = params;
    return await trafficSourceNetowrkCampaignsAdsetsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
    );
  }

  async trafficSourceNetworkCampaignsStats(params) {
    const { startDate, endDate, network, trafficSource, mediaBuyer, adAccountId, q, orgId } =
      params;
    return await trafficSourceNetworkCampaignsStats(
      this.database,
      startDate,
      endDate,
      network,
      trafficSource,
      mediaBuyer,
      adAccountId,
      q,
      orgId,
    );
  }

  async trafficSourceNetworkDaily(params) {
    const { startDate, endDate, mediaBuyer, adAccountId } =
      params;
    return await trafficSourceNetworkDaily(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      adAccountId
    );
  }

  async trafficSourceNetworkHourly(params) {
    const { startDate, endDate, mediaBuyer, adAccountId } =
      params;
    return await trafficSourceNetworkHourly(
      this.database,
      startDate,
      endDate,
      mediaBuyer,
      adAccountId
    );
  }

  async compileAggregates(network, trafficSource, startDate, endDate, campaignIdsRestriction) {
    return await compileAggregates(
      this.database,
      network,
      trafficSource,
      startDate,
      endDate,
      campaignIdsRestriction,
    );
  }

  generateUpsertQuery(rowToInsert) {
    return `INSERT INTO efflux.insights (
      org_id, event_timestamp, campaign_id,
      campaign_name, adset_id, adset_name,
      user_id, ad_account_id, revenue,
      spend, spend_plus_fee, link_clicks,
      network_conversions, network_uniq_conversions,
      nbr_of_searches, nbr_of_visitors,
      nbr_of_tracked_visitors, nbr_of_impressions,
      nbr_of_lander_visits, unique_identifier,
      unallocated_revenue, unallocated_spend,
      unallocated_spend_plus_fee, traffic_source_conversions,
      traffic_source, traffic_source_clicks,
      traffic_source_updated_at, postback_conversions,
      postback_lander_conversions, postback_serp_conversions,
      network_updated_at, network
    )
    SELECT
      ${rowToInsert.org_id},
      ${rowToInsert.event_timestamp ? `'${rowToInsert.event_timestamp}'` : null},
      ${rowToInsert.campaign_id},
      ${rowToInsert.campaign_name ? `'${rowToInsert.campaign_name}'` : null},
      ${rowToInsert.adset_id},
      ${rowToInsert.adset_name ? `'${rowToInsert.adset_name}'` : null},
      ${rowToInsert.user_id ? rowToInsert.user_id : null},
      ${rowToInsert.ad_account_id},
      ${rowToInsert.revenue},
      ${rowToInsert.spend},
      ${rowToInsert.spend_plus_fee},
      ${rowToInsert.link_clicks},
      ${rowToInsert.network_conversions},
      ${rowToInsert.network_uniq_conversions ? rowToInsert.network_uniq_conversions : null},
      ${rowToInsert.nbr_of_searches},
      ${rowToInsert.nbr_of_visitors},
      ${rowToInsert.nbr_of_tracked_visitors},
      ${rowToInsert.nbr_of_impressions},
      ${rowToInsert.nbr_of_lander_visits},
      '${rowToInsert.unique_identifier ? rowToInsert.unique_identifier : null}',
      ${rowToInsert.unallocated_revenue},
      ${rowToInsert.unallocated_spend},
      ${rowToInsert.unallocated_spend_plus_fee},
      ${rowToInsert.traffic_source_conversions},
      ${rowToInsert.traffic_source ? `'${rowToInsert.traffic_source}'` : null},
      ${rowToInsert.traffic_source_clicks},
      ${
        rowToInsert.traffic_source_updated_at
          ? `'${formatDateToISO(rowToInsert.traffic_source_updated_at)}'`
          : null
      },
      ${rowToInsert.postback_conversions},
      ${rowToInsert.postback_lander_conversions},
      ${rowToInsert.postback_serp_conversions},
      ${rowToInsert.network_updated_at ? `'${rowToInsert.network_updated_at}'` : null},
      ${rowToInsert.network ? `'${rowToInsert.network}'` : null}
    FROM
      (
        SELECT
          count(*) AS cnt
        FROM
          efflux.${this.tableName}
        WHERE
          unique_identifier = '${rowToInsert.unique_identifier}'
      )
    WHERE
      cnt = 0;`;
  }

  async upsert(data, trafficSource, network, chunkSize = 500) {
    const mappedData = data.map((row) => this.toDatabaseDTO(row, trafficSource, network));
    const dataChunks = _.chunk(mappedData, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, 'unique_identifier');
      await this.clickhouse.upsertClickHouse(this.tableName, chunk, 'unique_identifier');
    }
    return dataChunks;
  }

  toDatabaseDTO(row, trafficSource, network) {
    row.network = network;
    row.traffic_source = trafficSource;
    if (trafficSource === 'taboola') {
      row.unique_identifier = `${row.campaign_id}-${row.date}-${row.hour}`;
    } else {
      row.unique_identifier = `${row.adset_id}-${row.date}-${row.hour}`;
    }
    delete row.ad_account_name;
    return row;
  }

  networkCampaignGroupingQueryMaker(network, mediaBuyerId, startDate, endDate){

    // Missing media buyer correlation

    const query = `

      SELECT
        MAX(r.network) AS network,
        r.network_campaign_id AS network_campaign_id,
        MAX(r.network_campaign_name) AS network_campaign_name,
        SUM(r.landings) AS total_landings,
        SUM(r.keyword_clicks) AS total_keyword_clicks,
        SUM(r.conversions) AS total_conversions,
        SUM(r.revenue) AS total_revenue,
        CASE
            WHEN COUNT(DISTINCT final) = 1 AND MAX(final) IS NOT NULL THEN MAX(final)
            ELSE 'not_final'
        END AS final,
        MAX(r.account) AS account
      FROM
        revenue r
      JOIN
        network_campaigns_user_relations ncur ON r.network_campaign_id = ncur.network_campaign_id
      WHERE
        r.occurred_at::date > '${startDate}'
        AND r.occurred_at::date <= '${endDate}'
        AND r.network='${network}'
        AND (${mediaBuyerId} IS NULL OR ncur.user_id = ${mediaBuyerId})
      GROUP BY
        r.network_campaign_id;
      `

    return query;

  }

  adAccountsGroupingQueryMaker(trafficSource, mediaBuyerId, startDate, endDate){

    const query = `
        SELECT
            s.ad_account_id,
            s.ad_account_name,
            s.traffic_source,
            SUM(s.spend) AS total_spend,
            SUM(s.spend_plus_fee) AS total_spend_plus_fee,
            SUM(s.impressions) AS total_impressions,
            SUM(s.clicks) AS total_clicks,
            SUM(s.link_clicks) AS total_link_clicks,
            SUM(s.ts_conversions) AS total_ts_conversions,
            adc.id AS adc_id,
            adc.provider_id AS provider_id
        FROM
            spend s
        JOIN
            ad_accounts adc ON s.ad_account_id::text = adc.provider_id
        JOIN
            u_aa_map uam ON adc.id = uam.aa_id
        WHERE
            s.traffic_source='${trafficSource}'
            AND DATE(s.occurred_at) > '${startDate}'
            AND DATE(s.occurred_at) <= '${endDate}'
            AND (${mediaBuyerId} IS NULL OR uam.u_id = ${mediaBuyerId})
        GROUP BY
            s.ad_account_id, s.ad_account_name, s.traffic_source, adc_id, provider_id;
    `;

    return query;

  }
  async networkCampaignGrouping(network, mediaBuyerId, startDate, endDate){

    // Create query

    const query = this.networkCampaignGroupingQueryMaker(
      network,
      mediaBuyerId,
      startDate,
      endDate
    );

    // Pass query and get values
    const { rows } = await this.database.raw(query);
    return rows;

  }

  async adAccountsGrouping(trafficSource, mediaBuyerId, startDate, endDate){

    // Create query
    const query = this.adAccountsGroupingQueryMaker(
      trafficSource,
      mediaBuyerId,
      startDate,
      endDate
    );

    // Pass query and get values
    const { rows } = await this.database.raw(query);
    return rows;

  }

}

module.exports = AggregatesRepository;
