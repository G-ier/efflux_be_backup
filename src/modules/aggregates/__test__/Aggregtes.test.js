// Local application imports
const {
  dateAggregation,
  hourAggregation,
  campaignsAggregation,
  campaignsAggregationWithAdsets,
  campaignsAggregationByAdset,
  campaignsAggregationByDate,
  campaignsAggregationByHour
}                                     = require('../../../../common/insightQueries');
const { ruleThemAllQuery }            = require('../../../../services/insightsService');
const { aggregatesGeneralized }       = require('../../../../common/aggregations/aggregatesGeneralized');
const { yesterdayYMD, dayYMD }        = require('../../../shared/helpers/calendar');
const AggregatesController            = require('../controllers/AggregatesController');
const AggregatesRepository            = require('../repositories/AggregatesRepository');
const AggregatesService               = require('../services/AggregatesService');

describe('AggregatesController', () => {

  let aggregatesController;
  let aggregatesRepository;
  let aggregatesService;
  const timeout = 30000;

  const req = {
    query : {
      trafficSource : "facebook",
      network : "crossroads",
      startDate : "2023-09-05",
      endDate  : "2023-09-08",
      campaignId : "23853094782330131"
    }
  }

  const res = {
    json: (data) => data
  }

  const matchAccumulate = (rows, fields=['spend', 'revenue']) => {

    const result = rows.reduce((acc, row) => {

      fields.forEach(field => {
        acc[field] = acc[field] || 0;

        if (row[field] === null || row[field] === undefined || isNaN(row[field])) row[field] = 0;
        else {
          row[field] = parseFloat(row[field]);
        }

        acc[field] += row[field];
      });

      return acc;
    }, {});

    Object.keys(result).forEach(key => {
      result[key] = result[key].toFixed(2);
    });

    return result;
  }

  beforeAll(() => {
    aggregatesController  = new AggregatesController();
    aggregatesRepository  = new AggregatesRepository();
    aggregatesService     = new AggregatesService();
  }, timeout);

  it('should update the aggregates table', async () => {
    const updateSuccessful = await aggregatesService.updateAggregates(
      req.query.network, req.query.trafficSource, req.query.startDate, req.query.endDate
    )
    expect(updateSuccessful).toEqual(true);

  }, timeout);

  it('should generate compiled aggregates that match ruleThemAllQuery', async () => {
    const microserviceData            = await aggregatesRepository.compileAggregates(
      req.query.network, req.query.trafficSource, req.query.startDate, req.query.endDate
    );
    const newResults                  = matchAccumulate(microserviceData);

    const {rows: oldData}             = await ruleThemAllQuery(
      req.query.network, req.query.trafficSource, req.query.startDate, req.query.endDate
    );
    const oldResults                  = matchAccumulate(oldData);

    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a aggregatesGeneralized that matches', async () => {

    const microserviceData            = await aggregatesRepository.revealBotSheets(
      req.query.startDate, req.query.endDate, 'adsets', 'tiktok'
    );
    const newResults                  = matchAccumulate(microserviceData, ['amount_spent', 'publisher_revenue']);

    const oldData                     = await aggregatesGeneralized(
      req.query.startDate, req.query.endDate, 'adsets', 'tiktok'
    );
    const oldResults                  = matchAccumulate(oldData, ['amount_spent', 'publisher_revenue']);

    expect(newResults).toStrictEqual(oldResults);

  }, timeout);

  it('should generate a generateCampaignAdsetsReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateCampaignAdsetsReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    console.log("generateCampaignAdsetsReport", req.query)
    const { rows: oldData }           = await campaignsAggregationByAdset(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.campaignId
    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a generateCampaignDailyReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateCampaignDailyReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    console.log("generateCampaignDailyReport microserviceData", microserviceData)
    const { rows: oldData }           = await campaignsAggregationByDate(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.campaignId
    );
    console.log("generateCampaignDailyReport oldData", oldData)
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a generateCampaignHourlyReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateCampaignHourlyReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    const { rows: oldData }           = await campaignsAggregationByHour(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.campaignId
    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a generateTrafficSourceNetworkCampaignsAdsetsStatsReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateTrafficSourceNetworkCampaignsAdsetsStatsReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    const { rows: oldData }           = await campaignsAggregationWithAdsets(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.trafficSource,
      req.query.mediaBuyer, req.query.adAccountId, req.query.q

    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a generateTrafficSourceNetworkCampaignsStatsReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateTrafficSourceNetworkCampaignsStatsReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    const { rows: oldData }           = await campaignsAggregation(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.trafficSource,
      req.query.mediaBuyer, req.query.adAccountId, req.query.q
    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);

  }, timeout);

  it('should generate a generateTrafficSourceNetworkDailyReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateTrafficSourceNetworkDailyReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    const { rows: oldData }           = await dateAggregation(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.trafficSource,
      req.query.mediaBuyer, req.query.adAccountId, req.query.q
    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  it('should generate a generateTrafficSourceNetworkHourlyReport that matches', async () => {
    const microserviceData            = await aggregatesController.generateTrafficSourceNetworkHourlyReport(req, res);
    const newResults                  = matchAccumulate(microserviceData);
    const { rows: oldData }           = await hourAggregation(
      yesterdayYMD(req.query.startDate), dayYMD(req.query.endDate), req.query.trafficSource,
      req.query.mediaBuyer, req.query.adAccountId, req.query.q
    );
    const oldResults                  = matchAccumulate(oldData);
    expect(newResults).toStrictEqual(oldResults);
  }, timeout);

  afterAll(async () => {
    // Cleanup: Optionally delete the created spreadsheet after all tests
    // This is just an example. You'd need to add a deleteSpreadsheet method to your class.
  });

});
