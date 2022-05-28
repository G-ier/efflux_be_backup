const models = require("../common/helpers");
const uaParser = require('ua-parser-js');
const moment = require("moment-timezone");
const db = require('../data/dbConfig');
const md5 = require("md5");
const { todayYMD, todayHH } = require('../common/day');

async function trackSystem1(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'];
  const referrer_url =  `https://${req.get('host')}${req.originalUrl}`

  console.log('S1 POSTBACK')

  // if(req.isBot) {
  //   await models.add('bot_conversions', {
    //     ip,
  //     referrer_url,
  //     user_agent,
  //   });
  //   return;
  // }

  console.log('req.query', req.query)

  const {
    fbclid, gclid, ad_id, adset_id, campaign_id, ad_name, adset_name, campaign_name, fbclick, fbserp, fbland, rskey = '', sub_id, sub_id2 = '', userIp, userAgent
  } = req.query;

  const event_name = fbclick || fbserp || fbland
  console.log('EVENT', event_name)

  const [campaign_id2, ad_id2, campaign_name2] = sub_id2.split('|');
  const ua = uaParser(userAgent);
console.log('useragent', userAgent)
  const fbc = `fb.1.${moment()
    .tz('America/Los_Angeles')
    .unix()}.${fbclid}`;

  // const fbp = `fb.1.${moment()
  //   .tz('America/Los_Angeles')
  //   .unix()}.${ip.replace(/\.|\:/g, '')}`;

  const event_id = md5(rskey + fbclid);
  
  const existData = await db.select('*').from('s1_conversions')
   .whereRaw('event_time >= ?', [moment().unix() - 2])
   .whereRaw('event_name = ?', [event_name.toLowerCase()])
   .whereRaw('date = ?', [moment().format('YYYY-MM-DD')])
   .whereRaw('fbclid = ?', [fbclid])
   .whereRaw('campaign_id = ?', [campaign_id || campaign_id2])
   .whereRaw('ad_id = ?', [ad_id || ad_id2])
   .whereRaw('adset_id = ?', [adset_id])
   .whereRaw('ip = ?', [userIp])
   console.log('existData', existData);
   if(existData.length == 0){
    const conversionData = {
      date: moment().format('YYYY-MM-DD'),
      hour: moment().format('HH'),
      fbclid,
      gclid,
      event_id,
      fbc,
      rskey,
      event_name: event_name.toLowerCase(),
      device: ua.device.name,
      os: `${ua.os.name} - ${ua.os.version}`,
      browser: ua.browser.name,
      ip:userIp,
      event_time: moment().unix(),
      posted_to_ts: false,
      campaign_id: campaign_id || campaign_id2,
      ad_id: ad_id || ad_id2,
      adset_id,
      referrer_url,
    }
     const [conversionId] = await models.add('s1_conversions', conversionData);
     console.log('SYSTEM1 EVENT', conversionId, conversionData);
   }
   else {
     console.log(' SYSTEM1 EVENT DUPLICATES')
   }
  return { message: 'No click id or pixel id provided, please send a click id down and try again' }
}

 
async function trackSedo(req) {
  console.log('SEDO POSTBACK')
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'];
  const referrer_url =  `https://${req.get('host')}${req.originalUrl}`
  const ua = uaParser(user_agent);
  console.log('req.query', req.query)

  const {
    amount, sub1, sub2, sub3, kw, position, url
  } = req.query;

  
  await models.add('postback_events', { 
    referrer_url,
    pb_value: amount,
    event_type: "sedo_conversion",
    date: todayYMD(),
    hour: todayHH(),
    ip,
    device: ua.device.name,
    os: `${ua.os.name} - ${ua.os.version}`,
    browser: ua.browser.name,
    campaign_id: sub1,
    adset_id: sub3,    
    network: 'sedo',
  })


  const conversionData = {
    date: moment().tz(process.env.SEDO_TIMEZONE).format('YYYY-MM-DD'),
    amount,
    sub1,
    sub2,
    sub3, 
    kw, 
    position,
    url
  }

  const [conversionId] = await models.add('sedo_conversions', conversionData);
  console.log('SEDO EVENT', conversionId, conversionData);
  return { message: 'No click id or pixel id provided, please send a click id down and try again' }
}

module.exports = {
  trackSystem1,
  trackSedo
}
