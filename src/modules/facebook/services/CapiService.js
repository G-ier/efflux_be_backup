// Third Party Imports
const _                     = require("lodash");
const sha256                = require('js-sha256');
const moment                = require('moment-timezone');
const { v4: uuidv4 }        = require('uuid');

// Local Imports
const { usStates }          = require('../../../shared/constants/states');
const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
const BaseService           = require("../../../shared/services/BaseService");
const { CapiLogger }        = require("../../../shared/lib/WinstonLogger");
const { FB_API_URL }        = require('../constants');
const DatabaseRepository    = require('../../../shared/lib/DatabaseRepository')

// Function to generate a unique event_id
function generateEventId() {
  return uuidv4();
}

class CapiService extends BaseService {

    constructor() {
        super(CapiLogger);
        this.database = new DatabaseRepository();
    }

    async createCapiLogEntry(data) {

      this.logger.info(`Adding CAPI Logs to the database`);

      const logEntries = data.map((event) => {

        const pst_timestamp = moment.utc(event.timestamp * 1000).tz('America/Los_Angeles').format('YYYY-MM-DDTHH:mm:ss');
        const constructed_fbc = !['', 'undefined', null, undefined].includes(event.fbc) ? false: true;
        const constructed_fbp = !['', 'undefined', null, undefined].includes(event.fbp) ? false: true;

        const eventPayload = {
          traffic_source: 'facebook',
          reported_date: todayYMD(),
          reported_hour: todayHH(),
          event_unix_timestamp: event.timestamp,
          isos_timestamp: pst_timestamp,
          tz: 'America/Los_Angeles',
          session_id: event.session_id,
          campaign_name: event.campaign_name,
          campaign_id: event.campaign_id,
          conversions_reported: event.purchase_event_count,
          revenue_reported: event.purchase_event_value,
          constructed_fbc: constructed_fbc,
          constructed_fbp: constructed_fbp,
          unique_identifier: `${event.id}-${event.timestamp}-${todayYMD()}-${todayHH()}`,
        }
        return eventPayload;
      })

      const dataChunks = _.chunk(logEntries, 1000);
      for (const chunk of dataChunks) {
        await this.database.upsert('capi_logs', chunk, 'unique_identifier');
      }

      this.logger.info(`Done adding CAPI Logs to the database`);
    }

    async postCapiEvents(token, pixel, data) {

      this.logger.info(`Sending ${data.data.length} events to Facebook CAPI for pixel ${pixel}`);
      console.log(data);
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

        const fbc = !['', 'undefined', null, undefined].includes(event.fbc) ? event.fbc : `fb.1.${event.timestamp * 1000}.${event.external}`;
        const fbp = !['', 'undefined', null, undefined].includes(event.fbp) ? event.fbp : `fb.1.${event.timestamp * 1000}.${generateEventId()}`;
        const state = event.country_code === 'US' && usStates[event.state.toUpperCase()] !== undefined
          ? usStates[event.state.toUpperCase()].toLowerCase()
          : event.state.toLowerCase().replace(" ", "")

        for ( let i = 0; i < event.conversions; i++ ) {

          if ( currentPayload.data.length === MAX_EVENTS ) {
            payloads.push(currentPayload)
            currentPayload = { data: [] }
          }

          const eventPayload = {
            event_name: 'Purchase',
            event_time: Number(event.timestamp),
            event_id: `${event.external}-${i}-${generateEventId()}`,
            action_source: "website",
            user_data: {
              country: [
                sha256(event.country_code.toLowerCase())
              ],
              client_ip_address: event.ip,
              client_user_agent: event.user_agent,
              ct: [
                sha256(event.city.toLowerCase().replace(" ", ""))
              ],
              fbc: fbc,
              fbp: fbp,
              st: [
                sha256(state)
              ],
            },
            opt_out: false,
            custom_data: {
              currency: 'USD',
              value: `${(event.purchase_event_value / event.purchase_event_count)}`,
              content_name: event.keyword,
            }
          }

          if (event.vertical) eventPayload.custom_data.content_type = event.vertical;
          currentPayload.data.push(eventPayload)
        }

      })

      // Add the last payload if it has any events
      if (currentPayload.data.length > 0) {
        payloads.push(currentPayload);
      }

      return payloads;
    };

    async updateInvalidEvents(brokenEvents, network='crossroads'){
      const eventIds        = brokenEvents.map((event) => event.id)
      this.logger.info(`Updating Broken Events in DB`);
      const tableName = network === 'crossroads' ? 'raw_crossroads_data' : 'tonic_raw_insights';
      const updatedCount = await this.database.update(tableName, {valid_pixel: false}, {unique_identifier: eventIds});
      this.logger.info(`Updated ${updatedCount} Broken events to Facebook CAPI`)
    }

    async updateReportedEvents(eventIds, network='crossroads') {

      this.logger.info(`Updating Reported Session in DB`);

      let updatedCount;
      if (network === 'crossroads') {
        updatedCount = await this.database.update('crossroads_raw_insights',
        {
          reported_conversions: this.database.connection.ref('conversions'),
          reported_amount: this.database.connection.ref('revenue')
        },
        {
          unique_identifier: eventIds
        })
      } else if (network === 'tonic') {
        updatedCount = await this.database.update('tonic_raw_insights',
          {
            reported_conversions: this.database.connection.ref('conversions'),
            reported_amount: this.database.connection.ref('revenue')
          },
          {
            unique_identifier: eventIds
          }
       )
      }
      this.logger.info(`Reported ${updatedCount} session to Facebook CAPI for network ${network}`);
    }
}

module.exports = CapiService;
