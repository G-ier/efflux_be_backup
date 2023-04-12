const _ = require('lodash');
const axios = require('axios');
const db = require('../data/dbConfig');
const { CLICKFLARE_URL, API_KEY } = require('../constants/clickflare');

/**
 * @name getAvailableFields
 * Returns available fields from Clickflare API <br>
 * Docs for endpoint: <br>
 * https://documenter.getpostman.com/view/1342820/2s8YRnnsPW
 * @returns {Promise<Array<object>>}
 */

async function getAvailableFields() {
  const config = {
    headers: {
      'api-key':API_KEY,
      'accept': 'application/json, text/plain, */*'
    }
  }
  const { data } = await axios.get(
    `${CLICKFLARE_URL}event-logs/columns`, config);
  return data;
}

/**
 * @name mapAvailableFields
 * @returns {Promise<Array<string>>}
 */
async function mapAvailableFields(fields) {
  let fieldsMap = [];
  fields.forEach(field => {
    fieldsMap = fieldsMap.concat(field.original.children)
  })
  return fieldsMap.map(field => field.original.field);
}


/**
 * @name getclickflareData
 * Get clickflare event-logs <br>
 * Docs for endpoint: <br>
 * https://documenter.getpostman.com/view/1342820/2s8YRnnsPW
 * @returns {Promise<Array<object>>}
 */
async function getclickflareData(startDate, endDate, timezone, metrics) {
  const config = {
    headers: {
      'api-key':API_KEY,
      'authority': 'api.clickflare.io',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,sq;q=0.8,fr;q=0.7,am;q=0.6',
      'content-type': 'application/json;charset=UTF-8'
    }
  }
  const clickflareData = [];
  let page = 1;
  let pageSize = 1000;
  let next = false;
  do {
    console.log('next page: ', page)
    next = false;
    const payload = {
      startDate,
      endDate,
      timezone,
      metrics,
      sortBy: 'ClickTime',
      orderType: 'desc',
      page,
      pageSize
    }

    const { data } = await axios.post(
      `${CLICKFLARE_URL}event-logs`, payload, config);
    if(data.totals.counter > pageSize * page) {
      page++;
      next = true;
    }
    clickflareData.push(...data.items);
  } while(next)
  return clickflareData;
}

function processKey(input) {
  let suffix = '';
  const idSuffix = input.includes('ID');
  if (idSuffix) {
    suffix = "_id"
  }
  const osSuffix = input.includes('OS');
  if (osSuffix) {
    suffix = "_os"
  }
  const trackingSuffix = input.includes("TrackingField")
  if (trackingSuffix) {
    suffix = "_" + input.replace("TrackingField", "")
  }
  const conversionParamSuffix = input.includes("ConversionParameter")
  if (conversionParamSuffix) {
    suffix = "_" + input.replace("ConversionParameter", "")
  }
  const customConversion = input.includes("CustomConversion")

  if (customConversion && !input.includes("ConversionNumber")) {
    suffix = "_" + input.replace("CustomConversion", "")
  }
  // Then, split the updated input string into separate words based on the capital letters
  const words = input.match(/[A-Z][a-z]+/g);

  // Then, join the words with underscores and convert to lowercase
  const output = words.join('_').toLowerCase();
  return output + suffix
}

async function processClickflareLogs(logs) {
  return logs.map((log) => {
    let obj = {}
    Object.entries(log).forEach(([key, value]) => {
      obj[processKey(key)] = value
    })
    return obj
  })
}

function overWriteData(){
  return new Promise((resolve) => {
    db.raw(`
      DELETE FROM tracking_data
      WHERE id IN (
        SELECT MIN(id)
        FROM tracking_data
        GROUP BY click_id, click_time, conversion_transaction, conversion_date, custom_conversion_number
        HAVING COUNT(*) > 1
      )
    `).then(result => {
        resolve(result.rowCount);
      })
    }); 
}

async function updateClickflareData(startDate, endDate, timezone) {

  console.log('start getAvailableFields')
  const availableFields = await getAvailableFields();
  const metrics = await mapAvailableFields(availableFields);

  const clickflareData = await getclickflareData(startDate, endDate, timezone, metrics);
  let clickflareLogs = await processClickflareLogs(clickflareData);

  // Separate the incoming data in chunks
  const clickChunks = _.chunk(clickflareLogs, 500);
  console.log("Entering Loop");
  for (let i = 0; i < clickChunks.length; i++) {
    await db("tracking_data").insert(clickChunks[i]);
  }

  // Clear the table from the dublicates
  console.log(`CREATED tracking_data LENGTH`, clickflareLogs.length)
  let rowsDeleted = await overWriteData();
  console.log("ROWS OVERWRITTEN tracking_data: ", rowsDeleted);

}

module.exports = { updateClickflareData };


