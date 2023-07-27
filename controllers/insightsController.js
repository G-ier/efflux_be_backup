const _               = require('lodash');
const db              = require('../data/dbConfig');

function insightsQueryToDatabaseInterface(data, trafficSource) {
  return data.map(row => {
    row.traffic_source = trafficSource
    row.unique_identifier = `${row.adset_id}-${row.date}-${row.hour}`
    delete row.ad_account_name;
    return row
  })
}

async function upsert(tableName, data, conflictTarget) {
  try {
      const insert = db(tableName).insert(data).toString();
      const conflictKeys = Object.keys(data[0]).map(key => `${key} = EXCLUDED.${key}`).join(', ');
      const query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${conflictKeys}`;
      await db.raw(query);
      console.log("Row/s has been upserted successfully.");

  } catch (error) {
      console.error("Error upserting row/s: ", error);
  }
}

async function updateInsightsOnDatabase(data, trafficSource) {

  // Perform any necessary transformations to the data
  const interfacedData = insightsQueryToDatabaseInterface(data, trafficSource)

  if (interfacedData.length === 0) {
    console.log("No data to insert")
    return
  }

  console.log("Sample", interfacedData[0])

  // Split into chunks of 500
  const dataChunks = _.chunk(interfacedData, 500)

  // Add each chunk to the database
  for (const chunk of dataChunks) {
    await upsert('insights', chunk, 'unique_identifier')
  }

  console.log("Done inserting insights")
}


module.exports = {
  updateInsightsOnDatabase
}
