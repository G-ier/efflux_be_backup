// Third party imports
const xml2js                                      = require('xml2js');
const _                                           = require("lodash");

// Local application imports
const { SedoLogger }                              = require("../../../shared/lib/WinstonLogger")
const BaseService                                 = require("../../../shared/services/BaseService");
const InsightsRepository                          = require("../repositories/InsightsRepository")
const DataCompiler                                = require("../services/DataCompiler")
const {
  calculateAccumulated
}                                                 = require("../../../shared/helpers/Utils")
const {
  SEDO_API_URL
}                                                 = require("../constants")
const EnvironmentVariablesManager                 = require('../../../shared/services/EnvironmentVariablesManager');
class InsightsService extends BaseService {

  constructor() {
    super(SedoLogger);
    this.repository = new InsightsRepository();
    this.dataCompiler = DataCompiler;
  }

  async getInsightsFromSedoApi(date) {

    this.logger.info(`Fetching Sedo data from API for date ${date}`);
    const url = `${SEDO_API_URL}DomainParkingSubIdReport`;
    const params = {
      'partnerid'     : EnvironmentVariablesManager.getEnvVariable('SEDO_PARTNERID'),
      'signkey'       : EnvironmentVariablesManager.getEnvVariable('SEDO_SIGNKEY'),
      'username'      : EnvironmentVariablesManager.getEnvVariable('SEDO_USERNAME'),
      'password'      : EnvironmentVariablesManager.getEnvVariable('SEDO_PASSWORD'),
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
      throw new Error(`Error fetching Sedo data from API for date ${date}: ${parsedXMLBody.SEDOFAULT.faultstring[0]._}`)
    }
    return parsedXMLBody.SEDOSTATS.item;
  }

  async compileFinalSedoInsight(date) {

    // Fetch Insights from Sedo API
    const sedoInsight = await this.getInsightsFromSedoApi(date)
    // Convert Sedo Insights to Database DTO and aggregate them by unique_identifier
    const processedSedoInsights = this.repository.processSedoInsights(sedoInsight, date)
    this.logger.info(`accumulatedSedoInsights post merge`, calculateAccumulated(processedSedoInsights))

    // Fetch Insights from the database. This data is put there by the Sedo Callback Processor Stack on AWS.
    const postbackInsightrs = await this.repository.fetchInsightsForCompilation(date)
    this.logger.info(`accumulated funnel flux insights post merge`, calculateAccumulated(postbackInsightrs, ['pb_conversions', 'pb_revenue', 'pb_visits']))

    // Merge Sedo and Funnel Flux Insights and distribute sedo final daily insights to hourly insights
    const finalResults = this.dataCompiler.distributeDtoH(postbackInsightrs, processedSedoInsights, this.logger)
    this.logger.info(`finals results post merge`, calculateAccumulated(finalResults,
      ['pb_conversions', 'conversions', 'pb_revenue', 'revenue', 'pb_visits', 'visitors']
    ))

    return finalResults
  }

  async syncSedoInsights(date) {

    this.logger.info(`Starting to sync Sedo data for date ${date}`);
    const insights = await this.compileFinalSedoInsight(date)
    this.logger.info(`Upserting ${insights.length} Sedo insights for date ${date}`);
    await this.executeWithLogging(
      () => this.repository.upsert(insights),
      `Error upserting ${insights.length} Sedo insights for date ${date}`
    )
    this.logger.info(`Done syncing Sedo data for date ${date}`);
  }
}

module.exports = InsightsService;
