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

}

module.exports = PageController;
