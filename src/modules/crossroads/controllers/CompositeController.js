const CompositeService = require("../services/CompositeService");
const { CROSSROADS_ACCOUNTS } = require("../constants");
class CompositeController {
  constructor() {
    this.compositeService = new CompositeService();
  }

  async updateData(req, res) {
    try {
      const { request_date } = req.body;
      const account = CROSSROADS_ACCOUNTS[0];
      await this.compositeService.updateData(account, request_date);
      res.status(200).json({ message: "Data updated successfully." });
    } catch (error) {
      console.error("Error updating data: ", error);
      res.status(500).json({ message: "Error updating data.", error: error.message });
    }
  }
}

module.exports = CompositeController;
