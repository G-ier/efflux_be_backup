const route = require('express').Router();
const models = require('../../common/helpers');
const { aggregateConversionReport } = require('../../common/aggregations');
const {
  getFacebookHourlyData,
  getGoogleHourlyData,
  getFacebookCrossroadByDates,
  getGoogleCrossroadByDates,
  getCampaignsGoogleCrossroads,
  getCampaignsFacebookCrossroads,
} = require('../../controllers/crossroadsController');
const { updateCrossroadsData } = require('../../services/crossroadsService');
const { CROSSROADS_ACCOUNTS } = require('../../constants/crossroads');


// @route     /api/crossroads/facebook
// @desc     GET crossroads/facebook data
// @Access   Private
route.get('/facebook/campaigns', async (req, res) => {
  try {
    const facebookCrossroads = await getCampaignsFacebookCrossroads(req.query);
    res.status(200).send(facebookCrossroads);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

route.get('/google/campaigns', async (req, res) => {
  try {
    const googleCrossroads = await getCampaignsGoogleCrossroads(req.query);
    res.status(200).send(googleCrossroads);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/**
 * @route /api/crossroads/facebook/hourly
 * @desc returns crossroads/facebook data grouped by hour
 * @access Private
 */
route.get('/facebook/campaign/hours', async (req, res) => {
  try {
    const data = await getFacebookHourlyData(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/**
 * @route /api/crossroads/google/hours
 * @desc returns crossroads/google data grouped by hour
 * @access Private
 */
route.get('/google/campaign/hours', async (req, res) => {
  try {
    const data = await getGoogleHourlyData(req.query);
    data.forEach((item) => {
      item.cpc = item.link_clicks
        ? Number((item.total_spent / item.link_clicks).toFixed(2))
        : 0;
    });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// @route     /api/crossroads/facebook
// @desc     GET crossroads/facebook data
// @Access   Private
route.get('/facebook/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const facebookCrossroads = await getFacebookCrossroadByDates({ start_date, end_date });
    res.status(200).json(facebookCrossroads);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

route.get('/google/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const googleCrossroads = await getGoogleCrossroadByDates({ start_date, end_date });
    res.status(200).json(googleCrossroads);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// @route     /api/crossroads
// @desc     POST crossroads data
// @Access   Private
route.post('/', async (req, res) => {
  const { name, api_key } = req.decoded;

  try {
    const account = await models.add('crossroads_accounts', {
      name,
      api_key,
    });

    if (account) {
      return res.status(200).json(account);
    }

    return res.status(500).json({ message: 'Account do not exist.' });
  } catch ({ message }) {
    res.status(404).json({ message });
  }
});

// @route     /live/intraday
// @desc     GET track
// @Access   Private
route.get('/live/conversions', async (req, res) => {
  try {
    const facebookPostbackConversions = await aggregateConversionReport();
    res.status(200).json(facebookPostbackConversions.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json(err.message);
  }
});

// @route     /api/crossroads/refresh
// @desc     POST crossroads refresh data
// @Access   Private
route.post('/refresh', async (req, res) => {
  const { date } = req.body;
  const account = CROSSROADS_ACCOUNTS[0];

  try {
    await updateCrossroadsData(account, date);
    res.status(200).json({ message: `Crossroads data on ${date} is updated!`});
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

module.exports = route;
