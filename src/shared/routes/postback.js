// Third party imports
const route = require('express').Router();
const fetch = require('node-fetch-commonjs');

// Local imports
const DatabaseRepository = require('../lib/DatabaseRepository');
const { sendSlackNotification } = require('../lib/SlackNotificationService');
const { PostbackLogger } = require('../../shared/lib/WinstonLogger');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

const writePostbacksToClickhouse = EnvironmentVariablesManager.getEnvVariable(
  'WRITE_POSTBACKS_TO_CLICKHOUSE',
);
const reporting = require('./reporting');

const db = new DatabaseRepository();

const callServerlessHandler = async (request, network, isConversion = 'false') => {
  if (writePostbacksToClickhouse == 'false') return;

  let API_GATEWAY_URL = 'https://safetracklinks.com';

  const networkPaths = {
    crossroads: '/efdav1',
    tonic: '/eftnv1',
    sedo: '/efsdv1',
    medianet: '/efmnv1',
  };

  API_GATEWAY_URL += networkPaths[network] || '/';
  console.log('Calling: ', API_GATEWAY_URL);

  try {
    // ?: I wanted to use Axios but it was not working with the serverless function
    // ?: It kept exceeding memory limit, so I fell back on node-fetch for the time being

    request.event_network = network;
    request.is_conversion = isConversion;
    request.is_postback = true;
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
  console.debug('DA GET');
  console.debug(req.query);
  PostbackLogger.info(`DA GET: ${JSON.stringify(req.query)}`);

  await callServerlessHandler(req, 'crossroads');
  res.status(200).json({ message: 'success' });
});

// @route     /trk
// @desc     POST track
// @Access   Public
// Conversion Event
route.post('/', async (req, res) => {
  console.debug('DA POST');
  await callServerlessHandler(req, 'crossroads', true);
  res.status(200).json({ message: 'success' });
});

route.get('/sedo', async (req, res) => {
  console.debug('SEDO GET');
  await callServerlessHandler(req, 'sedo');
  res.status(200).json({ message: 'success' });
});

route.get('/tonic', async (req, res) => {
  console.debug('TONIC GET');
  await callServerlessHandler(req, 'tonic');
  res.status(200).json({ message: 'success' });
});

// @route     /trk/pb_test
// @desc     Get track
// @Access   Public
route.get('/pb_test', async (req, res) => {
  await callServerlessHandler(req, 'pb_test');
  res.status(200).json({ message: 'success' });
});

// @route     /trk/pb_test
// @desc     post track
// @Access   Public
route.post('/pb_test', async (req, res) => {
  await callServerlessHandler(req, 'pb_test');
  res.status(200).json({ message: 'success' });
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
