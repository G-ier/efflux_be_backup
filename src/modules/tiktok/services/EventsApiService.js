const axios = require("axios");
const _ = require("lodash");
const {TIKTOK_API_URL} = require("../constants");

const BaseService = require("../../../shared/services/BaseService");
const { CapiLogger } = require("../../../shared/lib/WinstonLogger");
const DatabaseRepository                  = require('../../../shared/lib/DatabaseRepository')

class EventsService extends BaseService {

    constructor(){
        super(CapiLogger);
        this.database = new DatabaseRepository();
    }

    async postCapiEvents(token, pixel, data){

        this.logger.info(`Sending TIKTOK data to Conversion API.`);

        const url = `${TIKTOK_API_URL}/pixel/batch/`;
        const headers = {
          'Content-Type': 'application/json',
          'Access-Token': token,
        };
        const body = {
          "pixel_code": pixel,
          "batch": data.data
        }

        const response = await this.postToApi(url, body, "Error posting events", headers);
        return response;
    }

    async constructTiktokCAPIPayload(filteredEvents){
      this.logger.info(`Constructing TT Capi payload`);
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
      this.logger.info(`Done constructing TT Capi payload`);
      return { ttProcessedPayloads, eventIds }
    }

    parseBrokenPixelEvents(events, pixels) {

      this.logger.info(`Parsing Events with broken Pixel ID`);
      const dbPixelIds        = pixels.map((pixel) => pixel.code);

      const brokenPixelEvents = events.filter((event) => !dbPixelIds.includes(event.pixel_id));
      // Mark broken pixel events as broken pixel events?
      const validPixelEvents  = events.filter((event) => dbPixelIds.includes(event.pixel_id));
      this.logger.info(
        `Events Parsing Telemetry: SUCCESS(${validPixelEvents.length}) | ERROR(${brokenPixelEvents.length})`,
      );

      return { brokenPixelEvents, validPixelEvents };
    }

    constructTiktokConversionEvents(events){

      const MAX_EVENTS = 1000;
      let payloads = [];
      let currentPayload = { data: [] };

      events.forEach((event) => {

        for ( let i = 0; i < event.purchase_event_count; i++ ) {

          if ( currentPayload.data.length === MAX_EVENTS ) {
            payloads.push(currentPayload)
            currentPayload = { data: [] }
          }

          const eventPayload = {
            event: "CompletePayment",
            timestamp: new Date(event.timestamp * 1000).toISOString(),
            pixel_code: event.pixel_id,
            event_id: `${event.external}_.${event.ip.replace(/\.|\:/g, '')}`,
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
      this.logger.info(`Updating Broken Events in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {valid_pixel: false}, {unique_identifier: eventIds});
      this.logger.info(`Updated ${updatedCount} Broken events to Tiktok CAPI`)
    }

    async updateReportedEvents(eventIds){
      this.logger.info(`Updating Reported Events in DB`);
      const updatedCount = await this.database.update('raw_crossroads_data', {reported_to_ts: true}, {unique_identifier: eventIds})
      this.logger.info(`Reported ${updatedCount} events to Tiktok CAPI`);
    }
}

module.exports = EventsService;
