const route = require("express").Router();
const _ = require('lodash');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const db = require('../../data/dbConfig');
const { dayBeforeYesterdayYMD, yesterdayYMD, threeDaysAgoYMD, someDaysAgoYMD, todayYMD } = require("../../common/day");
const { preferredOrder } = require("../../controllers/spreadsheetController")
const { updateSpreadsheet } = require("../../services/spreadsheetService")
const { TEMPLATE_SHEET_VALUES, TEMPLATE_ADSET_SHEET_VALUES,  sheetsArr } = require('../../constants/templateSheet');
const CreativeManager = require('../../controllers/creativesController');


route.post("/", async (req, res) => {

  // Ideally these will be images in bulk
  res.status(200).send({ message: "Here we develop routes" });
});

module.exports = route;
