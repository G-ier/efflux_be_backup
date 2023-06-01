const route = require('express').Router();
const {
  facebookMediaNetByDate,
  hourlyMediaNetFacebook,
  campaignsFacebookMedianet
} = require('../../common/aggregations');
const { processDateHoles } = require('../../common/helpers');
const { yesterdayYMD, dayYMD } = require('../../common/day');

// @route     /api/media-net/facebook
// @desc     GET media-net/facebook data
// @Access   Private
route.get('/facebook/campaigns', async (req, res) => {
  try {

    console.log("Request Query", req.query)
    const {
      start_date, end_date, media_buyer, ad_account, q
    } = req.query;
    const startDate = yesterdayYMD(start_date);
    const endDate = dayYMD(end_date);
    const { rows } = await campaignsFacebookMedianet(
      startDate,
      endDate,
      media_buyer,
      ad_account,
      q,
    );
    res.status(200).send(rows);

  } catch (err) {
    console.log(err)
    res.status(500).json(err.message);
  }
});

/**
 * @route /api/media-net/facebook/hourly
 * @desc returns media-net/facebook data grouped by hour
 * @access Private
 */
route.get('/facebook/campaign/hours', async (req, res) => {
  try {
    const {
      start_date, end_date, media_buyer, account_id, q
    } = req.query;

    const { rows } = await hourlyMediaNetFacebook(
      start_date,
      end_date,
      media_buyer,
      null,
      account_id,
      q,
    );

    res.status(200).json(rows);
  } catch (err) {
    console.log(err)
    res.status(500).json(err.message);
  }
});


// @route     /api/media-net/facebook
// @desc     GET media-net/facebook data
// @Access   Private
route.get('/facebook/campaigns/dates', async (req, res) => {
  const { start_date, end_date } = req.query;
  console.log("Request Query", req.query)
  try {
    const newStartDate = yesterdayYMD(start_date);
    const newEndDate = dayYMD(end_date);
    const { rows } = await facebookMediaNetByDate(newStartDate, newEndDate);
    const facebookmedianet =  processDateHoles(rows, newStartDate, newEndDate);
    console.log("facebookmedianet", facebookmedianet[0])
    res.status(200).json(facebookmedianet);
  } catch (err) {
    console.log(err);
    res.status(500).json(err.message);
  }
});

module.exports = route;
