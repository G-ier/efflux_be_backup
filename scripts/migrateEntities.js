const _ = require("lodash");
const knex = require("knex");
const knexConfig = require("../knexfile");
const oldDB = knex(knexConfig.oldproduction);
const DatabaseConnection = require("../src/shared/lib/DatabaseConnection");
const newDB = new DatabaseConnection().getConnection();


const dataMapper = (entities) => {
  return entities.map((entity) => {
    delete entity.optimizationType;
    return entity
  })
}

const ______ = async (data, startDate, endDate, tablename) => {
  const totalCount = data.rows.length;
  let migrated = 0;
  console.log('Migrating', totalCount, tablename, 'for date range', startDate, 'to', endDate);
  const dataChunks = _.chunk(data.rows, 1000);

  for (const chunk of dataChunks) {
    const dataMapped = dataMapper(chunk);
    await newDB(tablename).insert(dataMapped);
    const iterationCount = dataMapped.length;
    migrated += iterationCount;
    const percentage = (migrated / totalCount) * 100;
    console.log(`${migrated} out of ${totalCount} migrated | [${percentage.toFixed(2)}%]`);
  }
  console.log("DONE")

};

const migrateEntities = async (startDate, endDate) => {

  // const users = await oldDB.raw(`SELECT * FROM users;`);
  // await ______(users, startDate, endDate, 'users');

  // const userAccounts = await oldDB.raw(`SELECT * FROM user_accounts;`);
  // await ______(userAccounts, startDate, endDate, 'user_accounts');

  const adAccounts = await oldDB.raw(`SELECT * FROM ad_accounts;`);
  await ______(adAccounts, startDate, endDate, 'ad_accounts');

  const campaigns = await oldDB.raw(`SELECT DISTINCT ON(id) * FROM campaigns;`);
  await ______(campaigns, startDate, endDate, 'campaigns');

  const adsets = await oldDB.raw(`SELECT * FROM adsets;`);
  await ______(adsets, startDate, endDate, 'adsets');

};

const updateStartDate = '2021-09-11'
const updateEndDate = '2023-09-13'
migrateEntities(updateStartDate, updateEndDate);
