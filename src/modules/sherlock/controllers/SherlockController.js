const SherlockService = require('../services/SherlockService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class SherlockController {
  constructor() {
    this.sherlockService = new SherlockService();
  }

  async extractRequestDataWithUser(req) {
    try {
      const user = req.user;
      let { mediaBuyer, ...otherParams } = req.query;
      if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== 'true') {
        if (!user) {
          throw new Error('User information not available in the request');
        }

        // Check if the user has 'admin' permission
        const isAdmin = user.roles && user.roles.includes('admin');
        // If the user is not an admin, enforce mediaBuyer to be the user's ID
        if (!isAdmin) {
          mediaBuyer = user.id; // Assuming 'id' is the user's identifier
        }
      }
      return { ...otherParams, mediaBuyer, user };
    } catch (e) {
      console.error('Error in extracting user:', e);
      throw e;
    }
  }

  async generateFindingsDaily(req, res) {
    console.log('HERE HERE HERE');
    try {
      const { startDate, endDate, campaignId } = await this.extractRequestDataWithUser(req);
      const user = req.user;
      const orgId = user?.org_id || 1; // 1 is for default org
      const data = await this.sherlockService.generateFindingsDaily(
        startDate,
        endDate,
        campaignId,
        orgId,
      );
      return res.json(data);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ error: e.message });
    }
  }
}

module.exports = SherlockController;
