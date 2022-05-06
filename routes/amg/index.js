const route = require('express').Router();
const models = require('../../common/helpers');
const {
  getFacebookHourlyData,
  getGoogleHourlyData,
  getFacebookAmgByDates,
  getGoogleAmgByDates,
  getCampaignsGoogleAmg,
  getCampaignsFacebookAmg,
} = require('../../controllers/amgController');
const { updateAMGData, getAMGData } = require('../../services/amgService');

// @route     /api/amg/facebook
// @desc     GET amg/facebook data
// @Access   Private
route.get('/facebook/campaigns', async (req, res) => {
  try {
    const facebookAmg = await getCampaignsFacebookAmg(req.query);
    res.status(200).send(facebookAmg);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

route.get('/google/campaigns', async (req, res) => {
  try {
    const googleAmg = await getCampaignsGoogleAmg(req.query);
    res.status(200).send(googleAmg);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/**
 * @route /api/amg/facebook/hourly
 * @desc returns amg/facebook data grouped by hour
 * @access Private
 */
route.get('/facebook/campaign/hours', async (req, res) => {
  try {
    const data = await getFacebookHourlyData(req.query);
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

/**
 * @route /api/amg/google/hours
 * @desc returns amg/google data grouped by hour
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

// @route     /api/amg/facebook
// @desc     GET amg/facebook data
// @Access   Private
route.get('/facebook/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const facebookAmg = await getFacebookAmgByDates({ start_date, end_date });
    res.status(200).json(facebookAmg);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

route.get('/google/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const googleAmg = await getGoogleAmgByDates({ start_date, end_date });
    res.status(200).json(googleAmg);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// @route     /api/amg
// @desc     POST amg data
// @Access   Private
route.post('/', async (req, res) => {
  const { name, api_key } = req.decoded;

  try {
    const account = await models.add('amg_accounts', {
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

// @route    /api/amg/refresh
// @desc     POST AMG refresh data
// @Access   Private
route.post("/refresh", async (req, res) => {
  const { date } = req.body;

  try {
    const amgData = await getAMGData(date)
    if (amgData) await updateAMGData(amgData.data, amgData.date);
    res.status(200).json({ message: `AMGs data on ${date} is updated!`});
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

module.exports = route;
