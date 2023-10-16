// Third party imports
const xml2js                                      = require('xml2js');
const _                                           = require("lodash");

// Local application imports
const { SedoLogger }                              = require("../../../shared/lib/WinstonLogger")
const BaseService                                 = require("../../../shared/services/BaseService");
const InsightsRepository                          = require("../repositories/InsightsRepository")
const DataCompiler                                = require("../services/DataCompiler")
const FFDataService                               = require("../../funnelFlux/services/FFDataService")
const { calculateAccumulated }                    = require("../../../shared/helpers/Utils")
const {
  SEDO_API_URL
}                                                 = require("../constants")

class InsightsService extends BaseService {

  constructor() {
    super(SedoLogger);
    this.repository = new InsightsRepository();
    this.FFDataService = new FFDataService();
    this.dataCompiler = DataCompiler;
  }

  async getInsightsFromSedoApi(date) {

    this.logger.info(`Fetching Sedo data from API for date ${date}`);
    const url = `${SEDO_API_URL}DomainParkingSubIdReport`;
    const params = {
      'partnerid'     : 328108, // process.env.SEDO_PARTNERID,
      'signkey'       : '620ca021b16a56a0c32666bd4f6544', //process.env.SEDO_SIGNKEY,
      'username'      : 'roixad2', //process.env.SEDO_USERNAME,
      'password'      : 'zu6i$iFC0lt7t01', //process.env.SEDO_PASSWORD,
      'output_method' : 'xml',
      'final'         : true,
      'date'          : date,
      'startfrom'     : 0,
      'results'       : 1000000,
    };

    const data = await this.fetchFromApi(url, params, "Error getting Sedo data from API")
    const parsedXMLBody = await xml2js.parseStringPromise(data);
    this.logger.info(`Fetched Sedo data from API for date ${date}`)

    if (parsedXMLBody.SEDOFAULT) {
      this.logger.error(`Error fetching Sedo data from API for date ${date}: ${parsedXMLBody.SEDOFAULT.faultstring[0]._}`)
      return []
    }
    return parsedXMLBody.SEDOSTATS.item;
  }

  async getFFApiInsights(date, tz="+01:00",includeDateMatchingIdentifier=false) {
    this.logger.info(`Starting to sync Sedo data from Funnel Flux for date ${date}`);
    // The timezone is hardcoded to Europe/Berlin because Final Sedo Insights are in that timezone
    const startDate = date + 'T00:00:00' + tz;
    const endDate = date + 'T23:59:59' + tz;
    const insights = await this.FFDataService.getAdsetHourlyReport(startDate, endDate, includeDateMatchingIdentifier)
    const processedInsights = this.repository.aggregateByUniqueIdentifier(insights)
    return processedInsights
  }

  async compileFinalSedoInsight(date) {

    // Fetch Insights from Sedo API
    const sedoInsight = await this.getInsightsFromSedoApi(date)
    // Convert Sedo Insights to Database DTO and aggregate them by unique_identifier
    const processedSedoInsights = this.repository.processSedoInsights(sedoInsight, date)
    this.logger.info(`accumulatedSedoInsights post merge`, calculateAccumulated(processedSedoInsights))

    // Fetch Insights from Funnel Flux API
    const funnelFluxInsight = await this.getFFApiInsights(date, "+02:00", true)
    this.logger.info(`accumulated funnel flux insights post merge`,calculateAccumulated(funnelFluxInsight, ['revenue', 'revenue_events', 'lander_visits']))

    // Merge Sedo and Funnel Flux Insights and distribute sedo final daily insights to hourly insights
    const finalResults = this.dataCompiler.distributeDtoH(funnelFluxInsight, processedSedoInsights, this.logger)
    this.logger.info(`accumulatedFinals`, calculateAccumulated(finalResults, ['revenue', 'revenue_events', 'lander_visits']))
    return finalResults
  }

  async syncSedoInsights(date, final=false) {
    this.logger.info(`Starting to sync Sedo data for date ${date} | Final: ${final}`);

    let insights;
    if (final) insights = await this.compileFinalSedoInsight(date)
    else insights = await this.getFFApiInsights(date)

    this.logger.info(`Upserting ${insights.length} Sedo insights for date ${date}`);
    await this.executeWithLogging(
      () => this.repository.upsert(insights),
      `Error upserting ${insights.length} Sedo insights for date ${date}`
    )
    this.logger.info(`Done syncing Sedo data for date ${date}`);
  }
}

module.exports = InsightsService;
