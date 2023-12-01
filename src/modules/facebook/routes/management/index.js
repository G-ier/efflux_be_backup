const route = require("express").Router();
const multer = require('multer');



const upload = multer({
  storage: multer.memoryStorage(),
});

const AdCreativesController = require("../../controllers/AdCreativeController");
const CompositeController = require("../../controllers/CompositeController");
const CampaignsController = require("../../controllers/CampaignsController");
const AdsetsController = require("../../controllers/AdsetsController");
const AdLauncherController = require("../../controllers/AdLauncherController");
const AdQueueController = require("../../controllers/AdQueueController");

const campaignsController = new CampaignsController();
const adsetsController = new AdsetsController();
const adCreativesController = new AdCreativesController();
const compositeController = new CompositeController();
const adLauncherController = new AdLauncherController()
const adQueueController = new AdQueueController()

// @route     /api/facebook/management/update-entity
// @desc     GET update-entity data
// @Access   Private
route.get("/update-entity", async (req, res) => {
  compositeController.updateEntity(req, res);
});

// @route     /api/facebook/management/duplicate-entity
// @desc     GET update-entity data
// @Access   Private
route.post("/duplicate-entity", async (req, res) => {
  compositeController.duplicateEntity(req, res);
});

// @route     POST /api/facebook/management/ad-creatives/sync
// @desc     Sync ad creatives
// @Access   Private
route.post("/ad-creatives/sync", adCreativesController.syncAdCreatives);

// @route     GET /api/facebook/management/ad-creatives
// @desc     Fetch ad creatives
// @Access   Private
route.get("/ad-creatives", adCreativesController.fetchAdCreatives);

// @route     POST /api/facebook/management/ad-creatives
// @desc     Add a new ad creative
// @Access   Private
route.post("/ad-creatives", (req,res) =>compositeController.createAdCreative(req, res));

// @route     PUT /api/facebook/management/ad-creatives/:creativeId
// @desc     Update an ad creative
// @Access   Private
route.put("/ad-creatives/:creativeId", adCreativesController.updateAdCreative);

// @route     DELETE /api/facebook/management/ad-creatives/:creativeId
// @desc     Delete an ad creative
// @Access   Private
route.delete("/ad-creatives/:creativeId", adCreativesController.deleteAdCreative);

// @route     GET /api/facebook/management/ad-creatives/:creativeId
// @desc     Fetch a specific ad creative by ID
// @Access   Private
route.get("/ad-creatives/:creativeId", adCreativesController.fetchAdCreativeById);

route.get("/campaigns",(req, res) => campaignsController.fetchCampaigns(req, res));

route.get("/adsets",(req, res) => adsetsController.fetchAdsets(req, res));

route.post("/create-campaign", (req, res) => compositeController.createCampaignInFacebook(req, res));

route.post("/create-adset",(req, res) => compositeController.createAdset(req, res));

route.post("/create-ad",(req, res) => compositeController.createAd(req, res));

route.post("/upload-video", upload.single('video'), (req, res) => adLauncherController.uploadVideoToFacebook(req, res));

route.post("/upload-image", upload.single('file'), (req, res) => adLauncherController.uploadImageToFacebook(req, res));

route.post("/launch-ad", upload.fields([{ name: 'video', maxCount: 5 }, { name: 'images', maxCount: 10 }]), (req, res) => adLauncherController.launchAd(req, res));
route.post("/queue-ad", upload.fields([{ name: 'video', maxCount: 5 }, { name: 'images', maxCount: 10 }]), (req, res) => adLauncherController.sendAdLaunchToQueue(req, res));
route.get("/ad-queues",(req, res) => adQueueController.fetchAdQueue(req, res))


module.exports = route;
