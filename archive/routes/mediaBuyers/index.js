const route = require('express').Router();
const {
  generateActivityReport
} = require('../../common/aggregations');

route.get('/activity-report', async (req, res) => {
  try {
    console.log("Request Query", req.query)
    const { rows } = await generateActivityReport(req.query);
    res.status(200).send(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json(err.message);
  }
});

module.exports = route;
