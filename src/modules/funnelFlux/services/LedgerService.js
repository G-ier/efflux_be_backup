// Local application imports
const FunnelFluxBaseService               = require('../services/FunnelFluxBaseService');

class LedgerService extends FunnelFluxBaseService {

  constructor() {
    super();
  }

  async getTrafficSources(status = 'active') {
    this.logger.info('Fetching traffic sources from the Funnel Flux API');
    const params = { status: status }
    const errorMessage = 'Error fetching traffic sources from the Funnel Flux API';
    return await this.makeFunnelFluxApiRequest('GET', 'trafficsource/list', params, errorMessage);
  }

  async getTrafficSourceCategories(status = 'active', includeChilds=true) {
    this.logger.info('Fetching traffic source categories from the Funnel Flux API');
    const params = { status: status, includeChilds: includeChilds }
    const errorMessage = 'Error fetching traffic source categories from the Funnel Flux API';
    return await this.makeFunnelFluxApiRequest('GET', 'trafficsource/category/list', params, errorMessage);
  }

  async getFunnelGroups(status = 'active', includeChilds=true) {
    this.logger.info('Fetching funnel groups from the Funnel Flux API');
    const params = { status: status, includeChilds: includeChilds }
    const errorMessage = 'Error fetching funnel groups from the Funnel Flux API';
    return await this.makeFunnelFluxApiRequest('GET', 'campaign/list', params, errorMessage);
  }

}

module.exports = LedgerService;
