// Third party imports
const route = require('express').Router();
const parser = require('ua-parser-js');
const md5 = require('md5');
const fetch = require('node-fetch-commonjs');

// Local imports
const { todayHH, todayYMD } = require('../../shared/helpers/calendar');
const PROVIDERS = require('../constants/providers');
const DatabaseRepository = require('../lib/DatabaseRepository');
const { sendSlackNotification } = require('../lib/SlackNotificationService');
const { PostbackLogger, PostbackTestLogger } = require('../../shared/lib/WinstonLogger');
const { PostbackQueue } = require('../helpers/Queue');
const { isNotNumeric } = require('../helpers/Utils');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const writePostbacksToClickhouse = EnvironmentVariablesManager.getEnvVariable(
  'WRITE_POSTBACKS_TO_CLICKHOUSE',
);
const reporting = require('./reporting');

const db = new DatabaseRepository();
const postbackQueue = new PostbackQueue();

const callServerlessHandler = async (request, network, isConversion = 'false') => {
  if (writePostbacksToClickhouse == 'false') return;

  let API_GATEWAY_URL = 'safetracklinks.com';

  const networkPaths = {
    crossroads: '/efdav1',
    tonic: '/eftov1nic',
    sedo: '/efsev1do',
    medianet: '/efmnv1',
  };

  API_GATEWAY_URL += networkPaths[network] || '/';
  console.log('Calling: ', API_GATEWAY_URL);
  PostbackLogger.info(`Calling: ${API_GATEWAY_URL}`);

  try {
    // ?: I wanted to use Axios but it was not working with the serverless function
    // ?: It kept exceeding memory limit, so I fell back on node-fetch for the time being

    request.event_network = network;
    request.is_conversion = isConversion;
    body = request.query ? JSON.stringify(request.query) : JSON.stringify(request.body);
    headers = {
      request: JSON.stringify(request.headers),
    };
    await fetch(API_GATEWAY_URL, {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  } catch (error) {
    console.error('❌ Error calling serverless function: ', error);
    PostbackLogger.error(`❌ Error calling serverless function: ${error}`);
  }
};

// @route     /trk
// @desc     GET track
// @Access   Public
route.get('/', async (req, res) => {
  await callServerlessHandler(req, 'crossroads');

  try {
    const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const client_user_agent = req.headers['user-agent'];
    const referrer_url = `https://${req.get('host')}${req.originalUrl}`;
    PostbackLogger.info(`DA PBQP: ${JSON.stringify(req.query)}`);
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
    const value = isNaN(parseFloat(req.query.value)) ? 0 : parseFloat(req.query.value);
    const step = isNaN(parseInt(req.query.step)) ? 0 : parseInt(req.query.step);

    // Traffic source labeling based on src
    let traffic_source;
    if (src === 'fbk') traffic_source = PROVIDERS.FACEBOOK;
    else if (src === 'tt') traffic_source = PROVIDERS.TIKTOK;
    else if (!src) traffic_source = 'unknown';
    else traffic_source = src;

    // check event_timestamp exist
    const ts = event_timestamp ? event_timestamp : Math.floor(Date.now() / 1000);
    let event_id = md5(ts + fbclid + tg2 + tg5 + eventType);
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
      event_id,
    };
    PostbackLogger.info(`PBDB: ${JSON.stringify(pb_conversion)}`);

    // Upsert into database
    postbackQueue.push(pb_conversion);
    await postbackQueue.processQueue(db);

    res
      .status(200)
      .contentType('application/javascript')
      .send('console.log("Operation successful");');
    PostbackLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackLogger.error(`POSTBACK CROSSROADS ERROR ${err}`);
    sendSlackNotification(`Postback Update Error: ${err.message}`);
    res.status(500).json(err.message);
  }
});

// @route     /trk
// @desc     POST track
// @Access   Public
// Conversion Event
route.post('/', async (req, res) => {
  await callServerlessHandler(req, 'crossroads', true);
  try {
    const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const client_user_agent = req.headers['user-agent'];
    const referrer_url = `https://${req.get('host')}${req.originalUrl}`;
    PostbackLogger.info(`DA PBQP: ${JSON.stringify(req.query)}`);
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
    const value = isNaN(parseFloat(req.query.value)) ? 0 : parseFloat(req.query.value);
    const step = isNaN(parseInt(req.query.step)) ? 0 : parseInt(req.query.step);

    // Traffic source labeling based on src
    let traffic_source;
    if (src === 'fbk') traffic_source = PROVIDERS.FACEBOOK;
    else if (src === 'tt') traffic_source = PROVIDERS.TIKTOK;
    else if (!src) traffic_source = 'unknown';
    else traffic_source = src;

    // check event_timestamp exist
    const ts = event_timestamp ? event_timestamp : Date.now();
    let event_id = md5(ts + fbclid + tg2 + tg5 + eventType);
    const pb_conversion = {
      fbclid,
      city,
      state,
      country,
      zipcode,
      event_timestamp: ts,
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
      event_id,
    };
    PostbackLogger.info(`PBDB: ${JSON.stringify(pb_conversion)}`);

    // Upsert into database
    postbackQueue.push(pb_conversion);
    await postbackQueue.processQueue(db);

    res
      .status(200)
      .contentType('application/javascript')
      .send('console.log("Operation successful");');
    PostbackLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackLogger.error(`POSTBACK CROSSROADS ERROR ${err}`);
    sendSlackNotification(`Postback Update Error: ${err.message}`);
    res.status(500).json(err.message);
  }
});

route.get('/sedo', async (req, res) => {
  await callServerlessHandler(req, 'sedo');
  try {
    const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const client_user_agent = req.headers['user-agent'];
    const referrer_url = `https://${req.get('host')}${req.originalUrl}`;

    PostbackLogger.info(`SEDO PBQP: ${JSON.stringify(req.query)}`);
    const {
      sub1,
      sub2,
      sub3,
      amount,
      relatedlink,
      kw,
      position,
      url,
      uniqueTransactionId,
      clickTimestamp,
    } = req.query;

    const domain = url;
    const funnel_id = sub1;
    const [campaign_id, adset_id, ad_id, traffic_source] = sub2
      ? sub2.replace(' ', '').split('|')
      : ['', '', '', ''];
    const hit_id = sub3;
    const ua = parser(client_user_agent);
    const value = isNaN(parseFloat(amount)) ? 0 : parseFloat(amount);

    // We don't know for sure how parameters come, but we need to compose a unique event_id
    const event_id = md5(clickTimestamp + uniqueTransactionId + campaign_id + adset_id + sub3);
    const pb_conversion = {
      fbclid: uniqueTransactionId, // ?
      event_timestamp: clickTimestamp,
      referrer_url,
      pb_value: value,
      event_type: 'Purchase',
      date: todayYMD(),
      hour: todayHH(),
      ip: client_ip_address,
      device: ua.device.name,
      os: `${ua.os.name} - ${ua.os.version}`,
      browser: ua.browser.name,
      campaign_id: campaign_id,
      adset_id: adset_id,
      ad_id: ad_id,
      network: 'sedo',
      traffic_source,
      kwp: kw,
      event_id,
    };
    PostbackLogger.info(`PBDB: ${JSON.stringify(pb_conversion)}`);

    // Upsert into database
    postbackQueue.push(pb_conversion);
    await postbackQueue.processQueue(db);

    res.status(200).json({ message: 'success' });
    PostbackLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackLogger.error(`POSTBACK SEDO ERROR ${err}`);
    // sendSlackNotification(`Postback Update Error: ${err.message}`)
    res.status(500).json(err.message);
  }
});

route.get('/tonic', async (req, res) => {
  await callServerlessHandler(req, 'tonic');
  try {
    const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const client_user_agent = req.headers['user-agent'];
    const referrer_url = `https://${req.get('host')}${req.originalUrl}`;
    const ua = parser(client_user_agent);

    // MAPPING
    // subid1: user-agent
    // subid2: pixel_id_|_campaign_id_|_adset_id_|_ad_id_|_traffic_source_|_external
    // subid3: hit_id
    // subid4: ip_|_country_code_|_region_|_city_|_timestamp_|_campaign_name

    PostbackLogger.info(`TONIC PBQP: ${JSON.stringify(req.query)}`);
    let { subid1, subid2, subid3, subid4, revenue, kwp, type } = req.query;

    // Renaming type to match the rest of the analytics
    if (type) {
      if (['view', 'redirect'].includes(type)) type = 'PageView';
      else if (['viewrt'].includes(type)) type = 'ViewContent';
      else if (
        ['click', 'estimated_revenue_5h', 'preestimated_revenue', 'estimated_revenue'].includes(
          type,
        )
      ) {
        if (type === 'click') revenue = 0;
        type = 'Purchase';
      }
    }
    if (type != 'Purchase') revenue = 0;

    // New Extracted Fields
    const user_agent = subid1 || 'Unknown';
    let [pixel_id, campaign_id, adset_id, ad_id, traffic_source, external] = subid2
      ? subid2.split('_|_')
      : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
    const session_id = subid3 || 'Unknown';
    let [ip, country_code, region, city, timestamp, campaign_name] = subid4
      ? subid4.split('_|_')
      : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];

    if (isNotNumeric(campaign_id)) campaign_id = 'Unknown';
    if (isNotNumeric(adset_id)) adset_id = 'Unknown';
    if (isNotNumeric(ad_id)) ad_id = 'Unknown';
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unknown';

    // maybe + keyword for eventId since we dont get eventType, to recheck
    const event_id = md5(timestamp + kwp + session_id + type);
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unknown';

    const pb_conversion = {
      date: todayYMD(),
      hour: todayHH(),
      event_timestamp: timestamp,
      event_type: type,
      pixel_id: pixel_id,
      campaign_id: campaign_id,
      adset_id: adset_id,
      ad_id: ad_id,
      step: 2,
      searchterm: kwp,
      referrer_url: referrer_url,
      pb_value: revenue,
      city: city,
      country: country_code,
      state: region,
      zipcode: '',
      traffic_source: traffic_source,
      running_direct: false,
      fbclid: external,
      posted_to_fb: false,
      os: `${ua.os.name} - ${ua.os.version}`,
      ip: ip,
      device: ua.device.name,
      browser: ua.browser.name,
      test_event_code: '',
      network: 'tonic',
      kwp: kwp,
      campaign_name: campaign_name,
      event_id: event_id,
    };
    PostbackLogger.info(`PBDB: ${JSON.stringify(pb_conversion)}`);

    // Upsert into database
    postbackQueue.push(pb_conversion);
    await postbackQueue.processQueue(db);

    res.status(200).json({ message: 'success' });
    PostbackLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackLogger.error(`POSTBACK TONIC ERROR ${err}`);
    res.status(500).json(err.message);
  }
});

// @route     /trk/pb_test
// @desc     Get track
// @Access   Public
route.get('/pb_test', async (req, res) => {
  await callServerlessHandler(req, 'pb_test');
  try {
    const headers = req.headers;
    const data = req.query;
    PostbackTestLogger.info(`Get Request Header: ${JSON.stringify(headers)}`);
    PostbackTestLogger.info(`Get Request Query: ${JSON.stringify(data)}`);
    res.status(200).json({ message: 'success' });
    PostbackTestLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackTestLogger.info(`ERROR during GET request`);
    PostbackTestLogger.error(`ERROR: ${err}`);
    res.status(500).json(err.message);
  }
});

// @route     /trk/pb_test
// @desc     post track
// @Access   Public
route.post('/pb_test', async (req, res) => {
  await callServerlessHandler(req, 'pb_test');
  try {
    const headers = req.headers;
    const data = req.body;
    PostbackTestLogger.info(`Post Request Header: ${JSON.stringify(headers)}`);
    PostbackTestLogger.info(`Post Request Body: ${JSON.stringify(data)}`);
    res.status(200).json({ message: 'success' });
    PostbackTestLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackTestLogger.info(`ERROR during POST request`);
    PostbackTestLogger.error(`ERROR: ${err}`);
    res.status(500).json(err.message);
  }
});

// @route     /trk/collect
// @desc     Get tracking data from GTM
// @Access   Public
route.get('/collect', async (req, res) => {
  // Deconstruct query params
  const { session_id, fbc, fbp } = req.query;
  PostbackLogger.info(`GTM FB TRACKING: ${JSON.stringify(req.query)}`);

  // Handle invalid requests
  if (!session_id || !fbc || !fbp) {
    res.status(400).json({ message: 'Bad Request - Missing required query params' });
    return;
  }

  // Store request data
  const trackingData = {
    session_id,
    fbc,
    fbp,
  };

  // Upsert into database
  try {
    await db.upsert('gtm_fb_cookie_values', [trackingData], 'session_id');
    res
      .status(200)
      .contentType('application/javascript')
      .send('console.log("Operation successful");');
    PostbackLogger.info(`SUCCESS`);
  } catch (err) {
    PostbackLogger.error(`POSTBACK GTM FB TRACKING ERROR ${err}`);
    sendSlackNotification(`Postback Update Error: ${err.message}`);
    res.status(500).json(err.message);
  }
});

route.use('/reporting', reporting);

module.exports = route;
