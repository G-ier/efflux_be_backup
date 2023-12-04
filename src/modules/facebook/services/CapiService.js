// Third Party Imports
const _                     = require("lodash");
const sha256                = require('js-sha256');
const moment                = require('moment-timezone');

// Local Imports
const { usStates }          = require('../../../shared/constants/states');
const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
const BaseService           = require("../../../shared/services/BaseService");
const { CapiLogger }        = require("../../../shared/lib/WinstonLogger");
const { FB_API_URL }        = require('../constants');
const DatabaseRepository    = require('../../../shared/lib/DatabaseRepository')

class CapiService extends BaseService{

    constructor(){
        super(CapiLogger);
        this.database = new DatabaseRepository();
    }

    async createCapiLogEntry(data) {
      this.logger.info(`Adding CAPI Logs to the database`);
      const logEntries = data.map((event) => {
        const session_id = event.id.split('-')[0];
        const pst_timestamp = moment.utc(event.timestamp * 1000).tz('America/Los_Angeles').format('YYYY-MM-DDTHH:mm:ss');
        return {
          traffic_source: 'facebook',
          reported_date: todayYMD(),
          reported_hour: todayHH(),
          event_unix_timestamp: event.timestamp,
          isos_timestamp: pst_timestamp,
          tz: 'America/Los_Angeles',
          session_id: session_id,
          campaign_name: event.campaign_name,
          campaign_id: event.campaign_id,
          conversions_reported: event.purchase_event_count,
          revenue_reported: event.purchase_event_value
        }
      })

      const dataChunks = _.chunk(logEntries, 1000);
      for (const chunk of dataChunks) {
        await this.database.insert('capi_logs', chunk);
      }

      this.logger.info(`Done adding CAPI Logs to the database`);
    }

    async postCapiEvents(token, pixel, data) {

      this.logger.info(`Sending ${data.data.length} events to Facebook CAPI for pixel ${pixel}`);

      const url = `${FB_API_URL}/${pixel}/events`;
      const response = await this.postToApi(url, {
          data: data.data,
          access_token: token
        }, "Error posting events"
      );
      this.logger.info(`Response from Facebook CAPI: ${JSON.stringify(response)}`)
      return response;
    }

    async parseBrokenPixelEvents(events, pixels) {
      this.logger.info(`Parsing Events with broken Pixel ID`);
      const dbPixelIds        = pixels.map((pixel) => pixel.pixel_id);
      const brokenPixelEvents = events.filter((event) => !dbPixelIds.includes(event.pixel_id))
      console.log(`Found ${brokenPixelEvents.length} broken pixel events`)
      const validPixelEvents  = events.filter((event) => dbPixelIds.includes(event.pixel_id))
      this.logger.info(
        `Events Parsing Telemetry: SUCCESS(${validPixelEvents.length}) | ERROR(${brokenPixelEvents.length})`,
      );

      return { brokenPixelEvents, validPixelEvents };
    }

    async constructFacebookCAPIPayload(filteredEvents) {

      this.logger.info(`Constructing FB Capi payload`);
      await this.createCapiLogEntry(filteredEvents);

      // 1. Extract Event Ids
      const eventIds        = filteredEvents.map((event) => event.id)
      // 2. Group by pixel id
      const fbPixelGrouped    = _.groupBy(filteredEvents, 'pixel_id')
      // 3. Construct facebook conversion payloads

      const fbProcessedPayloads = []
      Object.entries(fbPixelGrouped).forEach(([pixelId, events]) => {
        const fbCAPIPayloads  = this.constructFacebookConversionEvents(events)
        fbProcessedPayloads.push({
            entityType: 'pixel',
            entityId: pixelId,
            payloads: fbCAPIPayloads
          })
      })
      this.logger.info(`Done constructing FB Capi payload`);
      return { fbProcessedPayloads, eventIds }
    }

    constructFacebookConversionEvents (events) {

      const MAX_EVENTS = 1000;

      let payloads = [];
      let currentPayload = { data: [] };

      events.forEach((event) => {

        if (['', null, undefined].includes(event.timestamp) || ['', null, undefined].includes(event.external))
          return;

        for ( let i = 0; i < event.purchase_event_count; i++ ) {

          if ( currentPayload.data.length === MAX_EVENTS ) {
            payloads.push(currentPayload)
            currentPayload = { data: [] }
          }

          const eventPayload = {
            event_name: 'Purchase',
            event_time: Number(event.timestamp),
            action_source: "website",
            user_data: {
              // Finished
              country: [
                sha256(event.country_code.toLowerCase())
              ],
              client_ip_address: event.ip,
              client_user_agent: event.user_agent,
              // Finished
              ct: [
                sha256(event.city.toLowerCase().replace(" ", ""))
              ],
              fbc: `fb.1.${event.timestamp}.${event.external}`,
              fbp: `fb.1.${event.timestamp}.${event.ip.replace(/\.|\:/g, '')}`,
              // Finished
              st: [
                sha256(
                  event.country_code === 'US' || event.country_code === 'United States' // The second condition is temporary until the update on FF takes place.
                  ? usStates[event.state.toUpperCase()].toLowerCase()
                  : event.state.toLowerCase().replace(" ", "")
                )
              ],
            },
            opt_out: false,
            custom_data: {
              currency: 'USD',
              value: `${(event.purchase_event_value / event.purchase_event_count)}`,
            }
          }
          currentPayload.data.push(eventPayload)
        }

      })

      // Add the last payload if it has any events
      if (currentPayload.data.length > 0) {
        payloads.push(currentPayload);
      }

      return payloads;
    };

    async updateInvalidEvents(brokenEvents){
      const eventIds        = brokenEvents.map((event) => event.id)
      this.logger.info(`Updating Broken Events in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {valid_pixel: false}, {unique_identifier: eventIds});
      this.logger.info(`Updated ${updatedCount} Broken events to Facebook CAPI`)
    }

    async updateReportedEvents(eventIds){
      this.logger.info(`Updating Reported Session in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {reported_to_ts: true}, {unique_identifier: eventIds})
      this.logger.info(`Reported ${updatedCount} session to Facebook CAPI`);
    }

}

module.exports = CapiService;
