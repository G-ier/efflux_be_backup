// Local imports
const {
  MEDIA_NET_API_BASE_URL
} = require('../constants/mediaNet')
const db = require('../data/dbConfig')
const {
  add
} = require('../common/models')

// Third party imports
const axios = require('axios');
const xml2js = require('xml2js');
const moment = require('moment-timezone');
const _ = require("lodash");

const getMediaNetData = async (reportType, date) => {
  // Retrieves data from MediaNet API
  const url = `${MEDIA_NET_API_BASE_URL}${reportType}?`

  // Creating the query string
  const params = new URLSearchParams({
    'customer_guid'     : process.env.MEDIA_NET_CUSTOMER_GUID,
    'customer_key'      : process.env.MEDIA_NET_CUSTOMER_KEY,
    'from_date'         : date,
    'to_date'           : date
  });
  const query = params.toString();

  // Retrieving the data
  const { data } = await axios.get(url + query)
  return data;
}

const parseXml = async (body) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(body, (err, result) => {
      if(err) reject(err);
      resolve(result)
    })
  })
}

const convertMediaNetQueryDate = (date) => {
  splitedDate = date.split('-')
  return `${splitedDate[1]}/${splitedDate[2]}/${splitedDate[0]}`
}

const convertMediaNetDate = (dateString, timezone='America/Los_Angeles') => {
    // Step 1: Convert the string into a Date Object
    let date;
    try {
      date = moment(dateString, 'ddd, MMM DD, YYYY HH:mm:ss');
    } catch (e) {
      console.log(`Error converting date ${dateString} to Date object`);
      return ['', ''];
    }

    // Step 2: Convert the date object in PST timezone.
    date.tz(timezone);  // PST timezone

    // Step 3: Extract the date in YYYY-MM-DD format
    let formattedDate = date.format('YYYY-MM-DD');

    // Extract the hour in 'H' (only number without preceding 0 for hours < 10) format
    let formattedHour = date.format('H');

    return [formattedDate, formattedHour];
}

const insertMediaNetData = async (data, date) => {

  console.log(`Inserting ${data.length} rows of Media Net Stats...`)

  // Delete the existing data for the date
  const removed = await db('media_net_stats').where({original_date : date}).del();
  console.log(`Media Net Stats : ${removed} rows deleted on date ${date}!`)

  // Insert the new data
  const dataChunks = _.chunk(data, 500);
  for (const chunk of dataChunks) {
    await add("media_net_stats", chunk);
  }

  console.log(`Media Net Stats : ${data.length} rows inserted successfully on date ${date}!`)
}

module.exports = {
  getMediaNetData,
  parseXml,
  convertMediaNetQueryDate,
  convertMediaNetDate,
  insertMediaNetData
}
