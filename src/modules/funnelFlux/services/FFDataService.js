// Local application imports
const ReportingService                        = require('./ReportingService');
const LedgerService                           = require('./LedgerService');
const FunnelFluxRepository                    = require("../repositories/FunnelFluxRepository");
const { FunnelFluxLogger }                    = require("../../../shared/lib/WinstonLogger");

class FFDataService {

  constructor() {
    this.reportingService = new ReportingService();
    this.ledgerService = new LedgerService();
    this.repository = new FunnelFluxRepository();
    this.logger = FunnelFluxLogger;
  }

  constrcutUpdateTrafficSegmentRequestBody(funnelIdCampaignIdTrafficSourceIdSpendMap, date) {

    // This function generates the request body for the updateTrafficSegment function.
    // The way the FF body links information is through list indexing, so the order of the
    // funnelIds, trafficSourceIds, and costSegments must be the same.
    // funnelIds[0] is linked to trafficSourceIds[0] and costSegments[0]

    const trafficSegmentsUpdateRequest = {
      funnelIds : [],
      trafficSourceIds : [],
      timeStart : date + "T00:00:00+00:00",
      timeEnd : date + "T23:59:59+00:00",
      costSegments : []
    }
    funnelIdCampaignIdTrafficSourceIdSpendMap.forEach(row => {
      const funnel_id = row.funnel_id;
      const campaign_id = row.campaign_id;
      const spend = row.spend;
      const traffic_source = row.traffic_source_id;
      trafficSegmentsUpdateRequest.funnelIds.push(funnel_id);
      trafficSegmentsUpdateRequest.trafficSourceIds.push(traffic_source);
      trafficSegmentsUpdateRequest.costSegments.push({
        cost: spend.toString(),
        costType: 'wholeSegment',
        restrictToTrackingFields: {
          campaign: [campaign_id]
        }
      });
    })
    return trafficSegmentsUpdateRequest;
  }

  async updateTrafficSegments(startDate, endDate, trafficSource) {

    this.logger.info("Updating traffic segments in the Funnel Flux API")

    const funnelIdCampaignIdTrafficSourceIdSpendMap =
        await this.repository.generateFunnelIdCampaignIdTrafficSourceIdSpendMap(startDate, endDate, trafficSource);

    const trafficSegmentsUpdateRequest =
        this.constrcutUpdateTrafficSegmentRequestBody(funnelIdCampaignIdTrafficSourceIdSpendMap, endDate);

    await this.reportingService.executeWithLogging(
      () => this.reportingService.updateTrafficSegment(trafficSegmentsUpdateRequest),
      "Error updating traffic segments in the Funnel Flux API"
    );

    this.logger.info("Finished updating traffic segments in the Funnel Flux API")
  };

  async getAdsetHourlyReport(startDate, endDate, includeDateMatchingIdentifier=false) {
    this.logger.info('Generating adset hourly revenue report');
    const data = await this.reportingService.createAdsetHourlyReport(startDate, endDate);
    const parsedFFData = data.rows.map((insight) => this.repository.parseFunnelFluxAPIData(insight, includeDateMatchingIdentifier));
    this.logger.info(`Generated adset with ${parsedFFData.length} insights for date range ${startDate} -> ${endDate}`);
    return parsedFFData
  };

}


module.exports = FFDataService;
