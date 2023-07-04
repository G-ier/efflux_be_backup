const db                    = require('../data/dbConfig')
const _                     = require("lodash");
const {
  mediaBuyersActivityCrossroads
}                           = require('../common/aggregations')

const updateMediaBuyersActivity = async (startDate, endDate) => {

  const { rows } = await mediaBuyersActivityCrossroads({start_date: startDate, end_date: endDate})

  console.log("Rows Sample", rows[0])

  //Separate the incoming data in chunks
  const rowsChunks = _.chunk(rows, 500);

  console.log("Entering Loop");

  for (let i = 0; i < rowsChunks.length; i++) {
    await db("activity_report").insert(rowsChunks[i]);
  }

}

module.exports = { updateMediaBuyersActivity };
