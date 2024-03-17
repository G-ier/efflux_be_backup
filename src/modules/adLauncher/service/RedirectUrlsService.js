const RedirectUrlRepository = require("../repositories/RedirectUrlRepository");


class RedirectUrlsService {
  constructor() {
    this.redirectUrls = [];
    this.redirectUrlRepository = new RedirectUrlRepository();
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
}

module.exports = RedirectUrlsService;
