const CompositeService = require("../services/CompositeService");

class CompositeController {
  constructor() {
    this.compositeService = new CompositeService();
  }

  async updateFacebookData(req, res) {
    const { date } = req.query;
    const updateResult = await this.compositeService.updateFacebookData(date);

    if (updateResult) res.staus(200).send("Facebook data updated");
    else res.status(500).send("The server failed to update facebook data");
  }

  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.compositeService.updateEntity({ type, entityId, status, dailyBudget });
      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }

  async duplicateEntity(req, res) {
    const { type, deep_copy, status_option, rename_options, entity_id } = req.body;
    try {
      const response = await this.compositeService.duplicateEntity({
        type,
        deep_copy,
        status_option,
        rename_options,
        entity_id,
      });

      res.status(200).json(response);
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }
}

module.exports = CompositeController;
