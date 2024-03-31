const SherlockService = require('../services/SherlockService');
const { SherlockLogger } = require('../../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const printDebug = true;

class SherlockController {
  constructor() {
    this.sherlockService = new SherlockService();
    this.logger = new SherlockLogger();
  }

  async generateFindingsDaily(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (printDebug) {
        console.log('START DATE: ', startDate);
        console.log('END DATE: ', endDate);
      }

      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org

      const findings = await this.sherlockService.generateFindingsDaily(startDate, endDate, orgId);

      if (printDebug) {
        console.debug('FINDINGS: ', findings);
        this.logger.info('FINDINGS: ', findings);
      }

      return res.status(200).json(findings);
    } catch (e) {
      console.error(e);
      this.logger.error(e.message);
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = SherlockController;
