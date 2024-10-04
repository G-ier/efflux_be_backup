// Local application imports
const FunnelFluxBaseService               = require('../services/FunnelFluxBaseService');


class ReportingService extends FunnelFluxBaseService {

  constructor() {
    super();
    this.availableFields = null;
  }

  async getAvailableFieldsFromApi() {

    if (this.availableFields) return this.availableFields;

    this.logger.info('Fetching the available fields from the Funnel Flux API');
    const availableFields =  await this.makeFunnelFluxApiRequest('GET', 'reporting/attributes', {}, 'Error fetching the available fields from the Funnel Flux API');
    this.availableFields = availableFields;
    return availableFields
  }

  async createRawEventReport(startDate, endDate) {

    this.logger.info('Creating the raw events report');
    const body = {
      timeStart: startDate,
      timeEnd: endDate,
      includeHits: true,
      includeClicks: true,
      includeConversions: true,
      pagingStart: 0,
      pagingLength: 1000
    }
    const errorMessage = 'Error creating the raw events report';
    return await this.makeFunnelFluxApiRequest('POST', 'reporting/hits', body, errorMessage);
  }

  async createAdsetHourlyReport(startDate, endDate) {

    // Funnel FLux URL Tracking Mappings
    // campaign_id : tiktok -> campaign | facebook -> campaign
    // adset_id : tiktok ->  c1 | facebook -> c2
    // a_id : tiktok ->  c2 | facebook -> c1
    // network : tiktok -> c5 | facebook -> c9

    this.logger.info('Creating the drilldown report');
    const body = {
      "timeStart": startDate,
      "timeEnd": endDate,
      "attributes": [
        {
          "attribute": "URL Tracking Field",
          "whitelistFilters": [
            "{\"campaign\":\"*\"}"
          ]
        },
        {
          "attribute": "URL Tracking Field",
          "whitelistFilters": [
            "{\"c1\":\"*\"}"
          ]
        },
        {
          "attribute": "URL Tracking Field",
          "whitelistFilters": [
            "{\"c2\":\"*\"}"
          ]
        },
        {
          "attribute": "URL Tracking Field",
          "whitelistFilters": [
            "{\"c5\":\"*\"}"
          ]
        },
        {
          "attribute": "URL Tracking Field",
          "whitelistFilters": [
            "{\"c9\":\"*\"}"
          ]
        },
        {
          "attribute": "Time: 1-Hour Blocks"
        },
        {
          "attribute": "Element: Offer"
        },
        {
          "attribute": "Third Parties: Offer Source"
        }
      ],
      "filters": []
    }


    const errorMessage = 'Error creating the drilldown report';
    return await this.makeFunnelFluxApiRequest('POST', 'reporting/drilldown', body, errorMessage);
  }

  async updateTrafficSegment(body) {
    this.logger.info('Updating traffic segments in the Funnel Flux API');
    const errorMessage = 'Error updating traffic segments in the Funnel Flux API';
    return await this.makeFunnelFluxApiRequest('PUT', 'reporting/update/cost', body, errorMessage);
  }

}

module.exports = ReportingService;
