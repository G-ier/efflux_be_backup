// Third Party Imports
const _                     = require("lodash");
const sha256                = require('js-sha256');
const moment                = require('moment-timezone');

// Local Imports
const { usStates }          = require('../../../shared/constants/states');
const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
// const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
const BaseService           = require("../../../shared/services/BaseService");
const { CapiLogger }        = require("../../../shared/lib/WinstonLogger");
const { TABOOLA_URL }        = require('../constants');
const DatabaseRepository    = require('../../../shared/lib/DatabaseRepository')

class S2SService extends BaseService{

    constructor() {
      super(CapiLogger);
      this.database = new DatabaseRepository();
    }

    async createS2SLogEntry(data) {
      this.logger.info(`Adding S2S Logs to the database`);
      const logEntries = data.map((event) => {
        const click_id = event.click_id;
        const pst_timestamp = moment.utc(event.timestamp * 1000).tz('America/Los_Angeles').format('YYYY-MM-DDTHH:mm:ss');
        return {
          traffic_source: 'taboola',
          reported_date: todayYMD(),
          reported_hour: todayHH(),
          name: event.conversion_rule,
          event_unix_timestamp: event.timestamp,
          isos_timestamp: pst_timestamp,
          tz: 'America/Los_Angeles',
          session_id: click_id,
          campaign_name: event.campaign_name,
          campaign_id: event.campaign_id,
          conversions_reported: event.purchase_event_count,
          revenue_reported: event.purchase_event_value
        }
      })
    //   const dataChunks = _.chunk(logEntries, 1000);
    //   for (const chunk of dataChunks) {
    //     await this.database.insert('capi_logs', chunk);
    //   }

      this.logger.info(`Done adding S2S Logs to the database`);
    }

    async postS2SEvents(data){

        //const url = `https://trc.taboola.com/${account_id}/log/3/bulk-s2s-action`;
        //this.logger.info(`Sending ${data.data.length} events to Taboola S2S for account ${account_id}`);

        // const response = await this.postToApi(url, {
        //     data,
        //   }, "Error posting events"
        // );
        // this.logger.info(`Response from Taboola S2S: ${JSON.stringify(response)}`)
        // return response;
    }

    async constructTaboolaS2SPayload(filteredEvents) {

      this.logger.info(`Constructing Taboola S2S payload`);
      // console.log("Filtered Events: \n \n");
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
      console.log(tblProcessedPayloads);
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
          click_id: event.external,
          timestamp: Number(event.timestamp),
          name: "search",
          revenue: event.revenue,
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

    // async parseBrokenAccountEvents(events, accounts) {
    //     this.logger.info(`Parsing Events with broken Pixel ID`);
    //     const dbPixelIds        = pixels.map((pixel) => pixel.pixel_id);
    //     const brokenPixelEvents = events.filter((event) => !dbPixelIds.includes(event.pixel_id))
    //     console.log(`Found ${brokenPixelEvents.length} broken pixel events`)
    //     const validPixelEvents  = events.filter((event) => dbPixelIds.includes(event.pixel_id))
    //     this.logger.info(
    //       `Events Parsing Telemetry: SUCCESS(${validPixelEvents.length}) | ERROR(${brokenPixelEvents.length})`,
    //     );

    //     return { brokenPixelEvents, validPixelEvents };
    // }

    // async updateInvalidEvents(brokenEvents){
    //   const eventIds        = brokenEvents.map((event) => event.id)
    //   this.logger.info(`Updating Broken Events in DB`);
    //   const updatedCount = await this.database.update('raw_crossroads_data', {valid_pixel: false}, {unique_identifier: eventIds});
    //   this.logger.info(`Updated ${updatedCount} Broken events to Facebook CAPI`)
    // }

    async updateReportedEvents(eventIds){
      this.logger.info(`Updating Reported Session in DB`);
      console.log(eventIds);
    //   updatedCount = await this.database.update('crossroads_raw_insights',
    //     {
    //       reported_conversions: this.database.connection.ref('conversions'),
    //       reported_amount: this.database.connection.ref('revenue')
    //     },
    //     {
    //       unique_identifier: eventIds
    //     }
    //  )

    //  this.logger.info(`Reported ${updatedCount} session to Facebook CAPI`);
    }

}

module.exports = S2SService;
