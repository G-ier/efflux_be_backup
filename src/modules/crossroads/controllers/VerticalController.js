const VerticalService = require('../services/VerticalService');
const { CrossroadsLogger } = require('../../../shared/lib/WinstonLogger');

class VerticalController {
  constructor() {
    this.service = new VerticalService();
  }

  async syncVerticalsFromCrossroads(req, res) {
    try {
      await this.service.syncVerticalsFromCrossroads();
      res.json({ message: 'Verticals synced successfully.' });
    } catch (error) {
      CrossroadsLogger.error('Error syncing verticals from Crossroads', error);
      res.status(500).json({ error: 'Failed to sync verticals from Crossroads.' });
    }
  }

  async getAllVerticals(req, res) {
    try {
      const verticals = await this.service.getAllVerticals();
      if (!verticals) {
        return res.status(404).json({ message: 'Verticals not found.' });
      }
      res.status(200).json(verticals);
    } catch (error) {
      CrossroadsLogger.error('Failed to fetch verticals:', error);
      res.status(500).json({ message: 'Failed to fetch verticals.' });
    }
  }

  async getVerticalById(req, res) {
    try {
      const { id } = req.params;
      const vertical = await this.service.getVerticalById(id);
      if (!vertical) {
        return res.status(404).json({ message: 'Vertical not found.' });
      }
      res.status(200).json(vertical);
    } catch (error) {
      CrossroadsLogger.error(`Failed to fetch vertical with ID ${id}:`, error);
      res.status(500).json({ message: 'Failed to fetch vertical.' });
    }
  }

  async deleteVerticalById(req, res) {
    try {
      const { id } = req.params;
      await this.service.deleteVerticalById(id);
      res.status(200).json({ message: 'Vertical deleted successfully.' });
    } catch (error) {
      CrossroadsLogger.error(`Failed to delete vertical with ID ${id}:`, error);
      res.status(500).json({ message: 'Failed to delete vertical.' });
    }
  }
}

module.exports = VerticalController;
