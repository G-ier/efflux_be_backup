const route = require('express').Router();
const {
  getFacebookHourlyData,
  getFacebookSystem1ByDates,
  getCampaignsFacebookSystem1,
} = require('../../controllers/system1Controller');
const {getDailyData, updateData, processDailyData} = require('../../services/system1Service');
const {getCampaignNames} = require('../../services/campaignsService');


// @route     /api/system1/facebook
// @desc     GET system1/facebook data
// @Access   Private
route.get('/facebook/campaigns', async (req, res) => {
  try {
    const facebookSystem1 = await getCampaignsFacebookSystem1(req.query);
    res.status(200).send(facebookSystem1);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

/**
 * @route /api/system1/facebook/hourly
 * @desc returns system1/facebook data grouped by hour
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

// @route     /api/system1/facebook
// @desc     GET system1/facebook data
// @Access   Private
route.get('/facebook/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const facebookSystem1 = await getFacebookSystem1ByDates({ start_date, end_date });
    res.status(200).json(facebookSystem1);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// @route     /api/crossroads/refresh
// @desc     POST crossroads refresh data
// @Access   Private
route.post('/refresh', async (req, res) => {
  const { date } = req.body;

  try {
    let dailyData = await getDailyData(date);
    if(!dailyData) throw Error(`System1 data on ${date} not found`);
    dailyData = processDailyData(dailyData);

    const campaignIds = dailyData.map(i => i.campaign_id).filter(i => i);
    const campaignNames = await getCampaignNames(campaignIds);
    dailyData = dailyData.map(item => {
      return {
        ...item,
        campaign_name: campaignNames[item.campaign_id]?.name ?? null
      };
    });
    await updateData(dailyData, date);
    res.status(200).json({ message: `System1 data on ${date} is updated!`});
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

module.exports = route;
