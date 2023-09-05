const CompositeService = require("../services/CompositeService");

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

  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;

    try {
      const updated = await this.compositeService.updateEntity({ type, entityId, status, dailyBudget });
      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(404).json({ message });
    }
  }
}

module.exports = CompositeController;
