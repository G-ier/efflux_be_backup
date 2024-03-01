// Third party imports
const route = require('express').Router();
const checkPermission = require('../../../middleware/checkPermissions');

// Local imports
const AggregatesController = require('./controllers/AggregatesController');
const RevealBotSheetController = require('./controllers/RevealBotSheetController');
const aggregatesController = new AggregatesController();
const revealBotSheetController = new RevealBotSheetController();

route.get('/campaign/adsets', async (req, res) =>
  await aggregatesController.generateCampaignAdsetsReport(req, res)
);

route.get('/campaign/daily', async (req, res) =>
  await aggregatesController.generateCampaignDailyReport(req, res)
);

route.get('/campaign/hourly', async (req, res) =>
  await aggregatesController.generateCampaignHourlyReport(req, res)
);

route.get('/campaigns-with-adsets', async (req, res) =>
  await aggregatesController.generateTrafficSourceNetworkCampaignsAdsetsStatsReport(req, res)
);

route.get('/campaigns-report', async (req, res) =>
  await aggregatesController.generateTrafficSourceNetworkCampaignsStatsReport(req, res)
);

route.get(
  '/daily-report',
  checkPermission(['read_reports']),
  async (req, res) => await aggregatesController.generateTrafficSourceNetworkDailyReport(req, res)
);

route.get(
  '/hourly-report',
  checkPermission(['read_reports']),
  async (req, res) => await aggregatesController.generateTrafficSourceNetworkHourlyReport(req, res)
);

route.get('/sync-data', async (req, res) =>
  await aggregatesController.syncData(req, res)
);

route.get('/refresh-sheet', async (req, res) =>  {
  await revealBotSheetController.refreshSheet(req, res)
})

module.exports = route;
