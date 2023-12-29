// Third Party Imports
const _                     = require("lodash");
const moment                = require('moment-timezone');

// Local Imports
const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
const BaseService           = require("../../../shared/services/BaseService");
const { CapiLogger }        = require("../../../shared/lib/WinstonLogger");
const DatabaseRepository    = require('../../../shared/lib/DatabaseRepository')

class S2SService extends BaseService{

    constructor() {
      super(CapiLogger);
      this.database = new DatabaseRepository();
    }

    async createS2SLogEntry(data) {
      this.logger.info(`Adding S2S Logs to the database`);
      const logEntries = data.map((event) => {
        const click_id = event.external;
        const pst_timestamp = moment.utc(event.timestamp * 1000).tz('America/Los_Angeles').format('YYYY-MM-DDTHH:mm:ss');
        return {
          traffic_source: 'taboola',
          reported_date: todayYMD(),
          reported_hour: todayHH(),
          event_unix_timestamp: event.timestamp,
          isos_timestamp: pst_timestamp,
          tz: 'America/Los_Angeles',
          session_id: click_id,
          campaign_name: event.campaign_name,
          campaign_id: event.campaign_id,
          conversions_reported: event.conversions,
          revenue_reported: event.revenue,
          unique_identifier: `${event.id}-${event.timestamp}-${todayYMD()}-${todayHH()}`,
        }
      })
      const dataChunks = _.chunk(logEntries, 1000);
      for (const chunk of dataChunks) {
        await this.database.upsert('capi_logs', chunk, 'unique_identifier');
      }

      this.logger.info(`Done adding S2S Logs to the database`);
    }

    async postS2SEvents(data, account_id){

        const url = `https://trc.taboola.com/${account_id}/log/3/bulk-s2s-action`;
        this.logger.info(`Sending ${data.actions.length} events to Taboola S2S for account ${account_id}`);

        const jsonPayload = JSON.stringify(data);
        const response = await this.postToApi(url, jsonPayload, "Error posting events");
        this.logger.info(`Response from Taboola S2S: ${JSON.stringify(response)}`)
        return response;
    }

    async constructTaboolaS2SPayload(filteredEvents) {

      this.logger.info(`Constructing Taboola S2S payload`);

      await this.createS2SLogEntry(filteredEvents);

      // 1. Extract Event Ids
      const eventIds        = filteredEvents.map((event) => event.id);

      // 2. Group by pixel id
      const tblAccountGrouped    = _.groupBy(filteredEvents, 'ad_account');

      // 3. Construct facebook conversion payloads

      const tblProcessedPayloads = []

      Object.entries(tblAccountGrouped).forEach(([account_id, events]) => {
        const tblS2SPayloads  = this.constructTaboolaConversionEvents(events)
        tblProcessedPayloads.push({
            entityType: 'ad_account',
            entityId: account_id,
            actions: tblS2SPayloads
          })
      })
      this.logger.info(`Done constructing Taboola S2S payload`);
      return { tblProcessedPayloads, eventIds }
    }

    constructTaboolaConversionEvents (events){

      const MAX_EVENTS = 500;

      let payloads = [];
      let currentPayload = { actions: [] };

      events.forEach((event) => {

        if ( currentPayload.actions.length === MAX_EVENTS ) {
          payloads.push(currentPayload)
          currentPayload = { actions: [] }
        }

        const eventPayload = {
          'click-id': event.external,
          timestamp: Number(event.timestamp) * 1000,
          name: "Search",
          revenue: Number(event.revenue),
          currency: "USD",
          quantity: event.conversions
        }
        currentPayload.actions.push(eventPayload)
      })

      // Add the last payload if it has any events
      if (currentPayload.actions.length > 0) {
        payloads.push(currentPayload);
      }

      return payloads;
    };

    async updateReportedEvents(eventIds){
      this.logger.info(`Updating Reported Session in DB`);
      const updatedCount = await this.database.update('crossroads_raw_insights',
        {
          reported_conversions: this.database.connection.ref('conversions'),
          reported_amount: this.database.connection.ref('revenue')
        },
        {
          unique_identifier: eventIds
        }
     )

     this.logger.info(`Reported ${updatedCount} sessions to Taboola S2S`);
    }

    async parseBrokenAccountEvents(events, accounts) {
        this.logger.info(`Parsing Events with broken account Ids`);
        const dbAccountIds        = accounts.map((account) => account.fb_account_id);

        const brokenAccountEvents = events.filter((event) => !dbAccountIds.includes(event.ad_account))
        console.log(`Found ${brokenAccountEvents.length} broken account events`)
        const validAccountEvents  = events.filter((event) => dbAccountIds.includes(event.ad_account))
        this.logger.info(
          `Events Parsing Telemetry: SUCCESS(${validAccountEvents.length}) | ERROR(${brokenAccountEvents.length})`,
        );

        return { brokenAccountEvents, validAccountEvents };
    }

    async updateInvalidEvents(brokenEvents){
      const eventIds        = brokenEvents.map((event) => event.id)
      this.logger.info(`Updating Broken Events in DB`);
      const updatedCount = await this.database.update('crossroads_raw_insights', {valid_pixel: false}, {unique_identifier: eventIds});
      this.logger.info(`Updated ${updatedCount} Broken events to Taboola S2S`)
    }
}

module.exports = S2SService;
