const route = require('express').Router();
const multer = require('multer');
const checkPermission = require('../../../../../middleware/checkPermissions');

const upload = multer({
  storage: multer.memoryStorage(),
});

const AdCreativesController = require('../../controllers/AdCreativeController');
const CompositeController = require('../../controllers/CompositeController');
const CampaignsController = require('../../controllers/CampaignsController');
const AdsetsController = require('../../controllers/AdsetsController');
const AdLauncherController = require('../../controllers/AdLauncherController');
const AdQueueController = require('../../controllers/AdQueueController');
const { error } = require('winston');

const campaignsController = new CampaignsController();
const adsetsController = new AdsetsController();
const adCreativesController = new AdCreativesController();
const compositeController = new CompositeController();
const adLauncherController = new AdLauncherController();
const adQueueController = new AdQueueController();

// @route     /api/facebook/management/update-entity
// @desc     GET update-entity data
// @Access   Private
route.get('/update-entity', async (req, res) => {
  compositeController.updateEntity(req, res);
});

// @route     /api/facebook/management/duplicate-entity
// @desc     GET update-entity data
// @Access   Private
route.post('/duplicate-entity', async (req, res) => {
  compositeController.duplicateEntity(req, res);
});

// @route     POST /api/facebook/management/ad-creatives/sync
// @desc     Sync ad creatives
// @Access   Private
route.post('/ad-creatives/sync', adCreativesController.syncAdCreatives);

// @route     GET /api/facebook/management/ad-creatives
// @desc     Fetch ad creatives
// @Access   Private
route.get('/ad-creatives', checkPermission(['read_ads']), (req, res) =>
  adCreativesController.fetchAdCreatives(req, res),
);

// @route     POST /api/facebook/management/ad-creatives
// @desc     Add a new ad creative
// @Access   Private
route.post('/ad-creatives', (req, res) => compositeController.createAdCreative(req, res));

// @route     PUT /api/facebook/management/ad-creatives/:creativeId
// @desc     Update an ad creative
// @Access   Private
route.put('/ad-creatives/:creativeId', checkPermission(['edit_ads']), (req, res) =>
  adCreativesController.updateAdCreative(req, res),
);

// @route     DELETE /api/facebook/management/ad-creatives/:creativeId
// @desc     Delete an ad creative
// @Access   Private
route.delete('/ad-creatives/:creativeId', checkPermission(['delete_ads']), (req, res) =>
  adCreativesController.deleteAdCreative(req, res),
);

// @route     GET /api/facebook/management/ad-creatives/:creativeId
// @desc     Fetch a specific ad creative by ID
// @Access   Private
route.get('/ad-creatives/:creativeId', checkPermission(['read_ads']), (req, res) =>
  adCreativesController.fetchAdCreative(req, res),
);

route.get('/campaigns', checkPermission(['read_campaigns']), (req, res) =>
  campaignsController.fetchCampaigns(req, res),
);

route.get('/campaigns_clickhouse', (req, res) =>
  campaignsController.fetchCampaignsFromClickhouse(req, res),
);

route.get('/adsets', checkPermission(['read_adsets']), (req, res) => {
  adsetsController.fetchAdsets(req, res);
});

route.post('/create-campaign', checkPermission('create_campaigns'), (req, res) =>
  compositeController.createCampaignInFacebook(req, res),
);

route.post('/create-adset', checkPermission('create_adsets'), (req, res) =>
  compositeController.createAdset(req, res),
);

route.post('/create-ad', checkPermission('create_ads'), (req, res) =>
  compositeController.createAd(req, res),
);

route.post('/upload-video', upload.single('video'), (req, res) =>
  adLauncherController.uploadVideoToFacebook(req, res),
);

route.post('/upload-image', upload.single('file'), (req, res) =>
  adLauncherController.uploadImageToFacebook(req, res),
);

route.post(`/draft-ad`, (req, res) => adLauncherController.pushDraftToDynamo(req, res));

route.post(`/save-template`, (req, res) => adLauncherController.saveCampaignTemplate(req, res));

route.get(`/templates`, (req, res) => adLauncherController.fetchCampaignTemplates(req, res));

route.get('template/:templateId', (req, res) =>
  adLauncherController.fetchCampaignTemplateById(req, res),
);

route.post(
  '/launch-ad',
  upload.fields([
    { name: 'video', maxCount: 5 },
    { name: 'images', maxCount: 10 },
  ]),
  // retry mechanism -- tries 3 times max
  async (req, res) => {

    let pause = 2;
    let counter = 0;
    const max_retry = 4;
    let error = false;
    let error_msg = "";
    for(counter; counter<max_retry; counter++){
      const response = await adLauncherController.launchAd(payload).catch(async error => {
        console.log(`Ad Launching failed --- lambda version ---`);
        console.log(`${error}`);
        console.log(`Ad Launching error above --- lambda version ---`);
        error_msg = error;
        await Promise(resolve => setImmediate(() => setTimeout(resolve, pause*1000)));
        pause = 2*pause;
        error = true;

      });

      if(error){
        if(counter < 2){
          error = false;
          continue;
        } else if(counter == 2){
          continue;
        }
      } else {
        counter = 5;
      }
    }

    if(error){
      res.status(500).json({
        success: false,
        message: 'An error occurred while launching the ad. All retries failed.',
        error: error?.error_user_msg || error.message,
      });
    }
  }
);
route.post(
  '/queue-ad',
  upload.fields([
    { name: 'video', maxCount: 5 },
    { name: 'images', maxCount: 10 },
  ]),
  (req, res) => adQueueController.sendLaunchToQueue(req, res),
);
route.get('/ad-queues', (req, res) => adQueueController.fetchAdQueue(req, res));

module.exports = route;
