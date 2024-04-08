// Local application imports
const PageService = require('../services/PageService');

class PageController {

  constructor() {
    this.pageService = new PageService();
  }

  async fetchPages(req, res) {
    const { fields, filters, limit } = req.body;
    const pages = await this.pageService.fetchPagesFromDB(fields, filters, limit);
    res.json(pages);
  }

  async fetchPagesByAdAccount(req, res) {
    const adAccountId = req.params.adAccountId;
    if (!adAccountId) {
      res.status(400).json({ message: 'Ad Account Id is required' });
    }

    const whereClause = {
      'auap.aa_id': adAccountId
    };
    const joins = [
      {
        type: "inner",
        table: "page_user_accounts AS pua",
        first: `pages.unique_identifier`,
        operator: "=",
        second: "pua.page_id",
      },
      {
        type: "inner",
        table: "aa_prioritized_ua_map AS auap",
        first: `auap.ua_id`,
        operator: "=",
        second: "pua.user_account_id",
      },
    ]

    const pages = await this.pageService.fetchPagesFromDB(['*'], whereClause, null, joins);
    res.json(pages);
  }

}

module.exports = PageController;
