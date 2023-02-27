const route = require('express').Router();
const axios = require('axios');
const moment = require('moment-timezone');
const uniqid = require('uniqid');
const parser = require('ua-parser-js');
const sha256 = require('js-sha256');
const md5 = require('md5');
const postbackCtrl = require('../../controllers/postbackController');

const Sentry = require('@sentry/node');
const { FB_API_URL } = require('../../constants/facebook');
const models = require('../../common/helpers');
const {todayHH, todayYMD} = require("../../common/day");
const PROVIDERS = require('../../constants/providers');
const db = require('../../data/dbConfig');

route.get('/system1', (req, res, next) => {
  postbackCtrl.trackSystem1(req).then((response) => {
    res.send(response);
  }).catch((err) => {
    console.log('S1 Track Error', err)
    res.end();
  });
})

route.get('/sedo', (req, res, next) => {
  postbackCtrl.trackSedo(req).then((response) => {
    res.send(response);
  }).catch((err) => {
    console.log('SEDO Track Error', err)
    res.end();
  });
})


// @route     /trk
// @desc     GET track
// @Access   Private
route.get('/', async (req, res) => {
  const client_ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const client_user_agent = req.headers['user-agent'];
  const referrer_url =  `https://${req.get('host')}${req.originalUrl}`

  console.log('POSTBACK CROSSROADS query', req.query)

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
  let traffic_source;
  const value = isNaN(parseFloat(req.query.value)) ? 0 : parseFloat(req.query.value);
  const step = isNaN(parseInt(req.query.step)) ? 0 : parseInt(req.query.step);
  if(tg1.includes('FB') || src.includes('FB')) traffic_source = PROVIDERS.FACEBOOK;
  else if(tg1.includes('TT') || src.includes('TT')) traffic_source = PROVIDERS.TIKTOK;
  // check event_timestamp exist
  let event_id = md5(event_timestamp + fbclid + tg2 + tg5 + eventType);
  const isEvent = false && await db('postback_events').where('event_id', '=', event_id).returning('id').first();
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
  if(!isEvent){
    console.log('add postback_events')
    await models.add('postback_events', pb_conversion )
  }
  else {
    console.log('update postback_events')
    await models.update('postback_events',isEvent.id,  pb_conversion)
  }


  const isConversion = eventType === 'Purchase'

  try {
    let campaign_id;
    let ad_id;
    let adset_id;
    let website;

    if (tg2 && tg2.includes('_')) {
      const split = tg2.split('_');
      traffic_source = split[0];
      campaign_id = split[1];
      ad_id = split[2];
      website = split[3];
    } else {
      campaign_id = tg2;
      ad_id = tg6;
      adset_id = tg5;
    }
    const generateFbc = `fb.1.${moment()
      .tz('America/Los_Angeles')
      .unix()}.${fbclid}`;

    if (isConversion)
    {
      const conversion = {
        date: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
        fbclid,
        event_id,
        fbc: generateFbc,
        device: ua.device.name,
        os: `${ua.os.name} - ${ua.os.version}`,
        browser: ua.browser.name,
        ip: client_ip_address,
        dt_value: value,
        event_time: moment().tz('America/Los_Angeles').unix(),
        event_name: eventType,
        posted_to_fb: false,
        traffic_source,
        campaign_id,
        ad_id,
        adset_id,
        website,
        referrer_url: `https://${req.get('host')}${req.originalUrl}`,
        hour: todayHH(),
        kwp
      };

      await models.add('fb_conversions', conversion);

    }
    res.status(200).json({});

  } catch (err) {
    console.log(err);

    Sentry.captureException(err);
    res.status(500).json(err.message);
  }
});

module.exports = route;
