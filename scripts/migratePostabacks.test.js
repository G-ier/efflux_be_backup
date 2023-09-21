const _ = require("lodash");
const knex = require("knex");
const knexConfig = require("../knexfile");
const DatabaseConnection = require("../src/shared/lib/DatabaseConnection");


describe('Migrated Postbacks should match', () => {

  let oldDB; let newDB;
  const timeout = 300000;
  const testType = 'daily';
  const date = '2023-09-10';
  const hour = 0;

  beforeAll(() => {
    oldDB = knex(knexConfig.oldproduction);
    newDB = new DatabaseConnection().getConnection();
  }, timeout);

  const accumulateEvents = (rows, field='event_type') => {
    return rows.reduce((acc, row) => {
      let eventType = row[field];
      if (acc[eventType] === undefined) acc[eventType] = 0;
      acc[eventType] += 1;
      return acc;
    }, {})
  }

  it('should match hourly', async () => {

    if (testType !== 'hourly') return;

    console.log('Running test for date', date, 'and hour', hour)

    const oldDbData = await oldDB('postback_events_partitioned')
      .select('*')
      .where('date', date)
      .where('hour', hour);
    const oldDbAccumulatedEvents = accumulateEvents(oldDbData);

    const newDbData = await newDB('postback_events')
      .select('*')
      .where('date', date)
      .where('hour', hour);
    const newDbAccumulatedEvents = accumulateEvents(newDbData);

    expect(oldDbAccumulatedEvents).toStrictEqual(newDbAccumulatedEvents);

  }, timeout)

  it('should match daily', async () => {

    if (testType !== 'daily') return;

    console.log('Running test for date', date)

    const oldDbData = await oldDB('postback_events_partitioned')
      .select('*')
      .where('date', date)
    const oldDbAccumulatedEvents = accumulateEvents(oldDbData);

    const newDbData = await newDB('postback_events')
      .select('*')
      .where('date', date)
    const newDbAccumulatedEvents = accumulateEvents(newDbData);

    expect(oldDbAccumulatedEvents).toStrictEqual(newDbAccumulatedEvents);

  }, timeout)

})
