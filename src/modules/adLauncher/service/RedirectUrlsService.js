const RedirectUrlRepository = require("../repositories/RedirectUrlRepository");
const SedoDomainsRepository = require("../../sedoDomains/repository/SedoDomainsRepository");


class RedirectUrlsService {
  constructor() {
    this.redirectUrls = [];
    this.redirectUrlRepository = new RedirectUrlRepository();
    this.sedoDomainRepository = new SedoDomainsRepository();
  }

  async getRedirectUrls(campaignId, network) {
    let filters;
    if (campaignId) {
      filters = { campaign_id: campaignId };
    }
    if (network) {
      filters = { ...filters, source: network };
    }
    const redirectUrls = await this.redirectUrlRepository.fetchRedirectUrls(
      ['*'],
      filters
    );
    return redirectUrls
  }

  async getSedoDomain() {
    const domains = await this.sedoDomainRepository.fetchSedoDomains();
    return domains;
  }

}

module.exports = RedirectUrlsService;
