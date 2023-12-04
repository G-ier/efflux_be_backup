// Third Party Imports
const _                     = require("lodash");
const moment                = require('moment-timezone');
const crypto                = require("crypto");

// Local Imports
const {TIKTOK_API_URL}      = require("../constants");
const BaseService           = require("../../../shared/services/BaseService");
const { todayYMD, todayHH } = require('../../../shared/helpers/calendar');
const { CapiLogger }        = require("../../../shared/lib/WinstonLogger");
const DatabaseRepository    = require('../../../shared/lib/DatabaseRepository')

class EventsService extends BaseService {

    constructor(){
        super(CapiLogger);
        this.database = new DatabaseRepository();
    }

    async createCapiLogEntry(data) {
      this.logger.info(`Adding CAPI Logs to the database`);
      const logEntries = data.map((event) => {
        const session_id = event.id.split('-')[0];
        const isos_timestamp = moment.utc(event.timestamp * 1000).tz('America/Los_Angeles').format('YYYY-MM-DDTHH:mm:ss');
        return {
          traffic_source: 'tiktok',
          reported_date: todayYMD(),
          reported_hour: todayHH(),
          event_unix_timestamp: event.timestamp,
          isos_timestamp: isos_timestamp,
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

    async postCapiEvents(token, pixel, data){

        this.logger.info(`Sending Tiktok events to Conversion API.`);

        const url = `${TIKTOK_API_URL}/pixel/batch/`;
        const headers = {
          'Content-Type': 'application/json',
          'Access-Token': token,
        };
        const body = {
          "pixel_code": pixel,
          "batch": data.data
        }
        this.logger.info(`Sending ${data.data.length} events to Tiktok CAPI for pixel ${pixel}`);
        const response = await this.postToApi(url, body, "Error posting events", headers);
        this.logger.info(`Response from Tiktok CAPI: ${JSON.stringify(response)}`)
        return response;
    }

    async constructTiktokCAPIPayload(filteredEvents){
      this.logger.info(`Constructing Tiktok Capi payloads`);
      await this.createCapiLogEntry(filteredEvents);
      const eventIds        = filteredEvents.map((event) => event.id)
      // 2. Group by pixel id
      const ttPixelGrouped    = _.groupBy(filteredEvents, 'pixel_id')
      // 3. Construct tiktok conversion payloads
      const ttProcessedPayloads = []
      Object.entries(ttPixelGrouped).forEach(([pixelId, events]) => {
        const ttCAPIPayloads  = this.constructTiktokConversionEvents(events)
        ttProcessedPayloads.push({
          entityType: 'pixel',
          entityId: pixelId,
          payloads: ttCAPIPayloads
        })
      })
      this.logger.info(`Done constructing Tiktok Capi payloads`);
      return { ttProcessedPayloads, eventIds }
    }

    parseBrokenPixelEvents(events, pixels) {

      this.logger.info(`Parsing Sessions with broken Pixel ID`);
      const dbPixelIds        = pixels.map((pixel) => pixel.code);

      const brokenPixelEvents = events.filter((event) => !dbPixelIds.includes(event.pixel_id));
      // Mark broken pixel events as broken pixel events?
      const validPixelEvents  = events.filter((event) => dbPixelIds.includes(event.pixel_id));
      this.logger.info(
        `Session Parsing Telemetry: SUCCESS(${validPixelEvents.length}) | ERROR(${brokenPixelEvents.length})`,
      );

      return { brokenPixelEvents, validPixelEvents };
    }

    constructTiktokConversionEvents(events){

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
            event: "CompletePayment",
            timestamp: new Date(event.timestamp * 1000).toISOString(),
            pixel_code: event.pixel_id,
            context: {
              ad: {
                callback: event.external,
              },
              // user: {
              //   ttp: "", // Add auto generated pixel code from browser. Capture with GTM or CUSTOM JS code.
              // },
              user_agent: event.user_agent,
              ip: event.ip,
            },
            properties: {
              content_type: "product",
              currency: "USD",
              value: event.purchase_event_value / event.purchase_event_count
            },
          };

          currentPayload.data.push(eventPayload);
        }

      });

      // Add the last payload if it has any events
      if (currentPayload.data.length > 0) {
        payloads.push(currentPayload);
      }

      return payloads;

    }

    async updateInvalidEvents(brokenEvents){
      const eventIds        = brokenEvents.map((event) => event.id)
      this.logger.info(`Updating Broken Sessions in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {valid_pixel: false}, {unique_identifier: eventIds});
      this.logger.info(`Updated ${updatedCount} Broken Sessions in DB`)
    }

    async updateReportedEvents(eventIds){
      this.logger.info(`Updating Reported Sessions in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {reported_to_ts: true}, {unique_identifier: eventIds})
      this.logger.info(`Reported ${updatedCount} Sessions in DB`);
    }
}

module.exports = EventsService;
