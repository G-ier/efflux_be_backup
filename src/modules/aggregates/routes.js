// Third party imports
const route = require('express').Router();

// Local imports
const AggregatesController = require('./controllers/AggregatesController');
const aggregatesController = new AggregatesController();

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

route.get('/daily-report', async (req, res) =>
  await aggregatesController.generateTrafficSourceNetworkDailyReport(req, res)
);

route.get('/hourly-report', async (req, res) =>
  await aggregatesController.generateTrafficSourceNetworkHourlyReport(req, res)
);

module.exports = route;
