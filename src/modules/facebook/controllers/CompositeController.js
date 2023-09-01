const CompositeService = require('../services/CompositeService');


class CompositeController {

    constructor() {
      this.compositeService = new CompositeService();
    }

    async updateFacebookData(req, res) {
      const { date } = req.query;
      const updateResult = this.compositeService.updateFacebookData(date);
      if (updateResult) res.staus(200).send("Facebook data updated");
      else res.status(500).send("The server failed to update facebook data");
    }

}

module.exports = CompositeController;
