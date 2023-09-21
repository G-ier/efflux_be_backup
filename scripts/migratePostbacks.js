const _ = require("lodash");
const knex = require("knex");
const knexConfig = require("../knexfile");
const oldDB = knex(knexConfig.oldproduction);
const DatabaseRepository = require("../src/shared/lib/DatabaseRepository");
const newDB = new DatabaseRepository()

const postbackMapper = (postbacks) => {
  return postbacks.map((postback) => {
    delete postback.id;
    return postback
  })
}

const migratePostbacks = async (startDate, endDate) => {
  const postbacks = await oldDB.raw(`
    SELECT DISTINCT ON (event_id) *
    FROM postback_events_partitioned
    WHERE date > '${startDate}' AND date <= '${endDate}';
  `);

  const totalCount = postbacks.rows.length;
  let migrated = 0;
  console.log('Migrating', totalCount, 'postbacks for date range', startDate, 'to', endDate);
  const postbackChunks = _.chunk(postbacks.rows, 1000);

  for (const chunk of postbackChunks) {
    const mappedPostbacks = postbackMapper(chunk);
    await newDB.upsert('postback_events', mappedPostbacks, 'event_id')
    const iterationCount = mappedPostbacks.length;
    migrated += iterationCount;
    const percentage = (migrated / totalCount) * 100;
    console.log(`${migrated} out of ${totalCount} migrated | [${percentage.toFixed(2)}%]`);
  }
  console.log("DONE")
};

const updateStartDate = '2023-09-19'
const updateEndDate = '2023-09-20'
migratePostbacks(updateStartDate, updateEndDate);
