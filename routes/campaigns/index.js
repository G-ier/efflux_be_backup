const router = require('express').Router();
const { getCampaignData, getCampaignHours, getCampaignDates, getCampaigns, deleteCampaign } = require("../../controllers/campaignsController");

router.get('/', async (req, res) => {
  try {
    const result = await getCampaigns(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { start_date, end_date, media_buyer } = req.query;
    const data = await getCampaignData(req.params.id, start_date, end_date, media_buyer);
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.delete('/', async (req, res) => {
  try {
    const data = await deleteCampaign(req.body.id);
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/:id/dates', async (req, res) => {
  try {
    const { start_date, end_date, media_buyer } = req.query;
    if (!start_date) {
      return res.status(400).json('start_date query parameter is required');
    }
    if (!end_date) {
      return res.status(400).json('end_date query parameter is required');
    }
    const data = await getCampaignDates(req.params.id, start_date, end_date, media_buyer);
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.get('/:id/hours', async (req, res) => {
  try {
    const { start_date, end_date, media_buyer } = req.query;
    const data = await getCampaignHours(req.params.id, start_date, end_date, media_buyer);
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


module.exports = router;
