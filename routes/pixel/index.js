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
  //
  // if(req.isBot) {
  //   await models.add('bot_conversions', {
  //     referrer_url,
  //     ip: client_ip_address,
  //     user_agent: client_user_agent,
  //   });
  //   return res.end()
  // }

  console.log('POSTBACK CROSSROADS query', req.query)

  const {
    pixel_id,
    fbclid,
    tg2,
    tg6,
    tg7,
    city,
    state,
    country,
    zipcode,
    eventType,
    event_time,
    running_direct,
    test_event_code,
    searchterm,
    _: event_timestamp,
  } = req.query;

  const ua = parser(client_user_agent);

  const value = isNaN(parseFloat(req.query.value)) ? 0 : parseFloat(req.query.value);
  const step = isNaN(parseInt(req.query.step)) ? 0 : parseInt(req.query.step);
  
  await models.add('postback_events', {
    pixel_id,
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
    campaign_id: tg2,
    adset_id: tg6,
    ad_id: tg7,
    network: 'crossroads',
  })

  await models.add('cr_postback_events', {
    pixel_id,
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
    campaign_id: tg2,
    adset_id: tg6,
    ad_id: tg7,
  })

  const isConversion = eventType === 'Purchase'

  try {
    if (pixel_id && fbclid) {
      let traffic_source;
      let campaign_id;
      let ad_id;
      let adset_id;
      let website;
      let pixelToken;
      let event_source_url;

      const pixelAvailable = await models.findBy('fb_pixels', { pixel_id });

      if (pixelAvailable) {
        pixelToken = pixelAvailable.token;
        event_source_url = `https://${pixelAvailable.domain}/`;
      }

      if (tg2 && tg2.includes('_')) {
        const split = tg2.split('_');
        traffic_source = split[0];
        campaign_id = split[1];
        ad_id = split[2];
        website = split[3];
      } else {
        campaign_id = tg2;
        adset_id = tg6;
      }

      let pixelEvents;
      let conversionId;
      const generateFbc = `fb.1.${moment()
        .tz('America/Los_Angeles')
        .unix()}.${fbclid}`;

      // let record = (await models.findBy("pixel_clicks", {fbclid})) || (await models.findBy("fb_conversions", {fbclid}));
      // if (record) {
      //  generateFbc = record.fbc;
      // }

      const fbp = `fb.1.${moment()
        .tz('America/Los_Angeles')
        .unix()}.${client_ip_address.replace(/\.|\:/g, '')}`;

      const ct = sha256(
        decodeURIComponent(city?.toLowerCase().replace(/\s/g, '')),
      );
      const st = sha256(decodeURIComponent(state?.toLowerCase()));
      const zp = sha256(
        decodeURIComponent(zipcode?.toLowerCase().replace(/\s/g, '')),
      );
      const countryHashed = sha256(
        decodeURIComponent(country?.toLowerCase().replace(/\s/g, '')),
      );

      let event_id = md5(searchterm + fbclid);
      if (!isConversion) {
        const [pixelId] = await models.add('pixel_clicks', {
          pixel_id,
          fbc: generateFbc,
          fbclid,
          event_id,
          event_time: moment().unix(),
          event_name: eventType,
          traffic_source,
          campaign_id,
          ad_id,
          adset_id,
          website,
          referrer_url,
        });

        event_id = pixelId;

        pixelEvents = [
          {
            event_name: eventType,
            action_source: 'website',
            event_id,
            event_time: moment().tz('America/Los_Angeles').unix(),
            user_data: {
              client_user_agent,
              client_ip_address,
              fbc: generateFbc,
              ct,
              st,
              zp,
              country: countryHashed,
            },
          },
        ];

        // console.log('NOT A CONVERSION', pixelEvents);
      } else {
        const conversion = {
          date: moment().tz('America/Los_Angeles').format('YYYY-MM-DD'),
          pixel_id,
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
          hour: todayHH()
        };

        [conversionId] = await models.add('fb_conversions', conversion);

        event_id = conversionId;

        pixelEvents = [
          {
            event_name: eventType,
            currency: 'USD',
            action_source: 'website',
            value,
            event_id,
            event_time: moment().tz('America/Los_Angeles').unix(),
            user_data: {
              client_user_agent,
              client_ip_address,
              fbc: generateFbc,
              ct,
              st,
              zp,
              country: countryHashed,
            },
          },
        ];

        // console.log('CONVERSION', pixelEvents);
      }

      const testObject = test_event_code
        ? {
          params: {
            data: pixelEvents,
            test_event_code,
          },
        }
        : {
          params: {
            data: pixelEvents,
          },
        };

      const response = await axios.post(
        `${FB_API_URL}${pixel_id}/events?access_token=${pixelToken}`,
        null,
        testObject,
      ).catch((err) => {
        const message = err.response ? err.response.data?.message : err.message;
        console.warn(`failed to post event to fb due: ${message}`)
        // console.log('post event to fb error', err)
        return null;
      });



      const result = {
        ...(response ? response.data: {}),
      };

      res.status(200).json(result);
    } else {
      res.status(200).json({
        message:
          'No click id or pixel id provided, please send a click id down and try again',
      });
    }
  } catch (err) {
    console.log(err);

    Sentry.captureException(err);
    res.status(500).json(err.message);
  }
});

module.exports = route;
