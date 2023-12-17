const CompositeService = require("../services/CompositeService");
const { CROSSROADS_ACCOUNTS } = require("../constants");
class CompositeController {
  constructor() {
    this.compositeService = new CompositeService();
  }

  async updateData(req, res) {
    try {
      const { request_date, save_aggregated, save_raw_data, save_raw_data_to_file, campaign_id_restrictions } = req.body;
      const accounts = CROSSROADS_ACCOUNTS;
      const saveAggregatedData = ![false, 'false'].includes(save_aggregated)
      console.log({ request_date, save_aggregated, save_raw_data, save_raw_data_to_file, saveAggregatedData, campaign_id_restrictions })
      await this.compositeService.updateData(accounts, request_date, saveAggregatedData, save_raw_data, save_raw_data_to_file, campaign_id_restrictions);
      res.status(200).json({ message: "Data updated successfully." });
    } catch (error) {
      console.error("Error updating data: ", error);
      res.status(500).json({ message: "Error updating data.", error: error.message });
    }
  }
}

module.exports = CompositeController;
