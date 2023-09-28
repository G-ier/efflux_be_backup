// Third party imports
const xml2js                                      = require('xml2js');

// Local application imports
const { SedoLogger }                              = require("../../../shared/lib/WinstonLogger")
const BaseService                                 = require("../../../shared/services/BaseService");
const InsightsRepository                          = require("../repositories/InsightsRepository")
const { calculateAccumulated }                    = require("../helpers")
const {
  SEDO_API_URL
}                                                 = require("../constants")

class InsightsService extends BaseService {

  constructor() {
    super(SedoLogger);
    this.repository = new InsightsRepository();
  }

  async getInsightsFromApi(date) {

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

    // const apiResult = calculateAccumulated(parsedXMLBody.SEDOSTATS.item)
    // console.log(apiResult)

    return parsedXMLBody.SEDOSTATS.item;
  }

  async syncSedoInsights(date) {
    this.logger.info(`Starting to sync Sedo data for date ${date}`);
    const insights = await this.getInsightsFromApi(date)
    this.logger.info(`Upserting ${insights.length} Sedo insights for date ${date}`);
    await this.executeWithLogging(
      () => this.repository.upsert(insights, date),
      `Error upserting ${insights.length} Sedo insights for date ${date}`
    )
    this.logger.info(`Done syncing Sedo data for date ${date}`);
  }
}

module.exports = InsightsService;
