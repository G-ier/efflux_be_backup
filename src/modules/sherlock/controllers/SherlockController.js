const SherlockService = require('../services/SherlockService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class SherlockController {
  constructor() {
    this.sherlockService = new SherlockService();
  }

  async generateFindingsDaily(req, res) {
    console.log('HERE HERE HERE');
    try {
      const { startDate, endDate } = req.query;
      // console.log('START DATE: ', startDate);
      // console.log('END DATE: ', endDate);

      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org

      const findings = await this.sherlockService.generateFindingsDaily(startDate, endDate, orgId);

      return res.status(200).json(findings);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = SherlockController;
