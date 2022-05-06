const route = require("express").Router();

const bodyParser = require("body-parser");
const {
  longTokenController,
} = require("../../controllers/longTokenController");
const { updateFacebookData, updateFacebookInsights } = require("../../controllers/facebookController");
const { getAndPrepareDataByAdId } = require("../../common/helpers");
const {todayYMD, todayHH} = require("../../common/day");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// @route     /api/facebook/report
// @desc     GET crossroads data
// @Access   Private
route.get("/facebook-report", async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    const crossroads = await getAndPrepareDataByAdId(res, start_date, end_date);
    res.status(200).json({ crossroads });
  } catch ({ message }) {
    res.status(404).json({ message });
  }
});

route.get("/", (req, res, next) => {
  res.send(200);
});
route.get("/longToken", longTokenController);

// @route    /api/facebook/refresh
// @desc     POST facebook refresh data
// @Access   Private
route.post("/refresh", async (req, res) => {
  const { date } = req.body;
  try {
    await updateFacebookData(date);
    await updateFacebookInsights(date);
    res.status(200).json({ message: `Facebook data on ${date} is updated!` });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

module.exports = route;
