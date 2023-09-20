// Third party imports
const route = require('express').Router();
const parser = require('ua-parser-js');
const md5 = require('md5');

// Local imports
const {todayHH, todayYMD} = require("../../shared/helpers/calendar");
const PROVIDERS = require('../constants/providers');
const DatabaseRepository = require('../lib/DatabaseRepository');
const { sendSlackNotification } = require("../lib/SlackNotificationService")
const { PostbackLogger } = require('../../shared/lib/WinstonLogger');
const Queue = require('../helpers/Queue');

const db = new DatabaseRepository()
const postbackQueue = new Queue();

async function processQueue() {

  if (postbackQueue.size() === postbackQueue.maxSize) {
    try {
      const batch = [];
      const seenEventIds = new Set();

      // Build the batch, while filtering out duplicates based on event_id
      while(batch.length < postbackQueue.maxSize && postbackQueue.size() > 0) {
        const item = postbackQueue.pop();
        if(!seenEventIds.has(item.event_id)) {
          seenEventIds.add(item.event_id);
          batch.push(item);
        }
      }

      // Perform the upsert
      await db.upsert('postback_events', batch, 'event_id');
      PostbackLogger.info(`Bulk Upserted: ${batch.length} items`);

    } catch (error) {

      PostbackLogger.error(`Error processing queue batch: ${error.message}`);

      // When encountering an error, remove duplicates and re-upsert.
      if (error.message.includes("ON CONFLICT DO UPDATE command cannot affect row a second time")) {
        // Filter batch to remove duplicates based on event_id
        const uniqueBatch = batch.filter((item, index, self) =>
          index === self.findIndex((i) => i.event_id === item.event_id)
        );

        // Re-attempt the upsert with the filtered batch
        await db.upsert('postback_events', uniqueBatch, 'event_id');
        PostbackLogger.info(`Re-upserted after removing duplicates: ${uniqueBatch.length} items`);
      }
    }
  }
}


// @route     /trk
// @desc     GET track
// @Access   Private
route.get('/', async (req, res) => {

  try {
    const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const client_user_agent = req.headers['user-agent'];
    const referrer_url =  `https://${req.get('host')}${req.originalUrl}`

    PostbackLogger.info(`PBQP: ${JSON.stringify(req.query)}`)
    const {
      tg1,
      tg2, // campaign_id
      tg3: fbclid, // fbclid
      tg5, // adset_id
      tg6, // ad_id
      tg7,
      kwp,
      src,
      city,
      state,
      country,
      zipcode,
      eventType,
      event_time,
      running_direct,
      test_event_code,
      _: event_timestamp,
    } = req.query;

    const ua = parser(client_user_agent);
    let traffic_source = 'unknown';
    const value = isNaN(parseFloat(req.query.value)) ? 0 : parseFloat(req.query.value);
    const step = isNaN(parseInt(req.query.step)) ? 0 : parseInt(req.query.step);

    // IMPORTANT NOTE: This traffic source defining is crucial for the platform to work properly.
    if(tg1?.includes('FB') || src?.includes('FB')) traffic_source = PROVIDERS.FACEBOOK;
    else if(tg1?.includes('TT') || src?.includes('TT')) {
      // sendSlackNotification(`Crosroads TikTok Postback tg1: ${tg1} src: ${src} event_type: ${eventType}`)
      traffic_source = PROVIDERS.TIKTOK
    };
    // check event_timestamp exist
    let event_id = md5(event_timestamp + fbclid + tg2 + tg5 + eventType);
    const pb_conversion = {
      fbclid,
      city,
      state,
      country,
      zipcode,
      event_timestamp,
      running_direct: running_direct === 'true',
      step,
      referrer_url,
      pb_value: value,
      event_type: eventType,
      date: todayYMD(),
      hour: todayHH(),
      ip: client_ip_address,
      device: ua.device.name,
      os: `${ua.os.name} - ${ua.os.version}`,
      browser: ua.browser.name,
      campaign_name: tg1,
      campaign_id: tg2,
      adset_id: tg5,
      ad_id: tg6,
      network: 'crossroads',
      traffic_source,
      kwp,
      event_id
    }
    PostbackLogger.info(`PBDB: ${JSON.stringify(pb_conversion)}`)

    // Upsert into database
    postbackQueue.push(pb_conversion);
    processQueue();

    res.status(200).json({message: 'success'});
    PostbackLogger.info(`SUCCESS`)
  }
  catch (err) {
    PostbackLogger.error(`POSTBACK CROSSROADS ERROR ${err}`)
    sendSlackNotification(`Postback Update Error: ${err.message}`)
    res.status(500).json(err.message);
  }
});

module.exports = route;
