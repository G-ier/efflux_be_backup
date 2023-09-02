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
route.post('', async (req, res) => {
  try {
    const facebookAmg = await getCampaignsFacebookAmg(req.query);
    res.status(200).send(facebookAmg);
  } catch (err) {
    res.status(500).json(err.message);
  }
});
