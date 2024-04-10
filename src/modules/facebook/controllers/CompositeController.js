const CompositeService = require("../services/CompositeService");
const AggregatesService = require("../../aggregates/services/AggregatesService");
const CampaignService = require("../services/CampaignsService");
const UserAccountService = require("../services/UserAccountService");
const AdAccountService = require("../services/AdAccountService");
const AdsetsService = require("../services/AdsetsService");
const _ = require("lodash");
const AdCreativesService = require("../services/AdCreativesService");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");

class CompositeController {

  constructor() {
    this.compositeService = new CompositeService();
    this.campaignService = new CampaignService();
    this.userAccountService = new UserAccountService();
    this.adAccountService = new AdAccountService();
    this.adsetsService = new AdsetsService();
    this.adCreativesService = new AdCreativesService();
  }

  async updateFacebookData(req, res) {
    const { startDate, endDate } = req.query;
    const updateResult = await this.compositeService.updateFacebookData(startDate, endDate, {
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: true,
    });

    if (updateResult) res.status(200).send("Facebook data updated");
    else res.status(500).send("The server failed to update facebook data");
  }

  async syncAccountData(req, res) {
    const { userAccountId } = req.query;

    // 1. Get the data of the user account
    const accounts = await this.compositeService.userAccountService.fetchUserAccountById(userAccountId, [
      "token",
      "name",
      "user_id",
      "provider_id",
      "id",
    ]);
    if (!accounts.length) res.status(200).send("No entity was found for the user");
    const account = accounts[0];

    // 2. Sync the facebook data of the account without insights
    const today = new Date().toISOString().split("T")[0];
    const syncEntityResult = await this.compositeService.syncUserAccountsData(account, today, today, {
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: false,
    });
    if (!syncEntityResult) res.status(500).send("The server failed to sync facebook data");

    // 3. Fetch campaigns earliest start_time
    const startTime = await this.compositeService.campaignsService.fetchUserAccountsEarliestCampaign(userAccountId);
    if (startTime === null) res.status(200).send("No entity was found for the user");

    // 4. Sync the facebook data of the account with insights
    const syncInsightsResult = await this.compositeService.syncUserAccountsData(account, startTime, today, {
      updateCampaigns: false,
      updateAdsets: false,
      updateInsights: true,
    });
    if (!syncInsightsResult) res.status(500).send("The server failed to sync facebook data");

    // 5. Fetch all campaign ids of the user account
    const fields = ['campaigns.id']
    const filters = {
      "map.ua_id": userAccountId
    };
    const joins = [
      {
        type: "inner",
        table: "ad_accounts AS aa",
        first: "aa.id",
        operator: "=",
        second: "campaigns.ad_account_id",
      },
      {
        type: "inner",
        table: "ua_aa_map AS map",
        first: "map.aa_id",
        operator: "=",
        second: "aa.id",
      },
    ];
    const campaignIds = await this.compositeService.campaignsService.fetchCampaignsFromDatabase(fields, filters, null, joins);

    const ids = campaignIds.map(({ id }) => id);
    const campaignIdsRestriction = `(${ids.map((id) => `'${id}'`).join(",")})`;

    // 6. Sync aggregates
    await new AggregatesService().updateFacebookUserAccountAggregates(startTime, today, campaignIdsRestriction);

    res.status(200).send("Facebook data synced");
  }

  async syncPixels(req, res) {
    try {
      await this.compositeService.syncPixels();
      res.json(true);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }

  async syncPages(req, res) {
    const pageIds = await this.compositeService.syncPages();
    res.json(pageIds);
  }

  async updateEntity(req, res) {
    const { entityId, status, dailyBudget, type } = req.query;
    try {
      const updated = await this.compositeService.updateEntity({ type, entityId, status, dailyBudget });
      res.status(200).json({ updated });
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }

  async duplicateEntity(req, res) {
    const { type, deep_copy, status_option, rename_options, entity_id } = req.body;
    try {
      const response = await this.compositeService.duplicateEntity({
        type,
        deep_copy,
        status_option,
        rename_options,
        entity_id,
      });

      res.status(200).json(response);
    } catch ({ message }) {
      res.status(500).json({ message });
    }
  }

  async createCampaignInFacebook(req, res) {
    try {
      const { adAccountId, campaignData } = req.body;
      const admins_only = true;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      const adAccountsDataMap = _(
        await this.adAccountService.fetchAdAccountsFromDatabase(["id", "provider_id", "user_id", "account_id"], {
          provider_id: adAccountId,
        }),
      )
        .keyBy("provider_id")
        .value();

      const result = await this.campaignService.createCampaign(token, adAccountId, campaignData, adAccountsDataMap);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || "Error creating campaign in Facebook.",
      });
    }
  }

  async createAdset(req, res) {
    try {
      const { adAccountId, adsetData } = req.body;
      const admins_only = true;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      const adAccountsDataMap = _(
        await this.adAccountService.fetchAdAccountsFromDatabase(["id", "provider_id", "user_id", "account_id"], {
          provider_id: adAccountId,
        }),
      )
        .keyBy("provider_id")
        .value();

      const facebookResponse = await this.adsetsService.createAdset(token, adAccountId, adsetData, adAccountsDataMap);

      res.json({
        success: true,
        message: "Adset successfully created in Facebook and saved to the database.",
        data: facebookResponse,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || "Error creating adset in Facebook.",
      });
    }
  }

  async createAdCreative(req, res) {
    try {
      const admins_only = true;
      const data = req.body;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);
      const result = await this.adCreativesService.createAdCreative(token, data);
      res.json(result);
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }

  async uploadVideoToFacebook(req, res) {
    try {
      if (!req.file) {
        throw new Error("No video file uploaded.");
      }

      // Retrieve the adAccountId from the request, user session, or however it is provided.
      const adAccountId = req.body.adAccountId;

      const admins_only = true;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      // Call the uploadVideo function with the required parameters.
      const uploadResult = await this.compositeService.uploadVideo(
        req.file.buffer,
        req.file.originalname,
        adAccountId,
        token,
      );
      res.status(200).json(uploadResult);
    } catch (error) {
      res.status(500).send(error.message || "Internal Server Error");
    }
  }

  async uploadImageToFacebook(req, res) {
    try {
      if (!req.file) {
        throw new Error("No image file uploaded.");
      }

      const adAccountId = req.body.adAccountId; // You can pass adAccountId in the form data
      const admins_only = true;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      // Pass the buffer, filename, adAccountId, and token to the uploadImage function
      const imageHash = await this.compositeService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        adAccountId,
        token,
      );

      res.status(200).json({ imageHash });
    } catch (error) {
      res.status(500).send(error.message || "Internal Server Error");
    }
  }

  async createAd(req, res) {
    try {
      // Get the necessary data from the request body.
      const { adAccountId, adData } = req.body;

      // The 'admins_only' flag could be a condition you have for certain operations.
      const admins_only = true;

      // Get an access token that will be used for making the API call.
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      // Assuming adCreativesService has a method to create an ad in Facebook.
      const facebookAdResponse = await this.compositeService.createAd({ token, adAccountId, adData });

      // Respond with a success message and the data returned from the Facebook API.
      res.status(200).json({
        success: true,
        message: "Ad successfully created in Facebook and saved to the database.",
        data: facebookAdResponse,
      });
    } catch (err) {
      // Log the error and send a response with the error message.
      res.status(500).json({
        success: false,
        message: err.message || "Error creating ad in Facebook.",
      });
    }
  }

  async launchAd(req, res) {
    try {
      FacebookLogger.info('Ad launch process initiated.');
      this.validateRequiredParameters(req);
      const token = await this.getToken();
      const adAccountId = this.getAdAccountId(req);
      const adAccountsDataMap = await this.getAdAccountsDataMap(adAccountId);
      // Get the first key from the adAccountsDataMap
      const firstKey = Object.keys(adAccountsDataMap)[0];

      // Log the start of campaign creation
      FacebookLogger.info('Starting campaign creation.');
      const campaignId = await this.handleCampaignCreation(req, token, firstKey, adAccountsDataMap);
      FacebookLogger.info(`Campaign created with ID: ${campaignId}`);

      // Log the start of ad set creation
      FacebookLogger.info('Starting ad set creation.');
      const adSetId = await this.handleAdsetCreation(req, token, firstKey, campaignId, adAccountsDataMap);
      FacebookLogger.info(`Ad Set created with ID: ${adSetId}`);

      // Log the start of media uploads
      FacebookLogger.info('Starting media uploads.');
      const uploadedMedia = await this.handleMediaUploads(req, firstKey, token);
      FacebookLogger.info(`Media uploaded: ${JSON.stringify(uploadedMedia)}`);

      // Log the start of ad data preparation
      FacebookLogger.info('Preparing ad data.');
      const adData = this.prepareAdData(req, uploadedMedia, adSetId);
      // Log the start of ad creation
      FacebookLogger.info('Starting ad creation.');
      const adCreationResult = await this.compositeService.createAd({token, adAccountId:firstKey, adData});

      // Log the successful creation of an ad
      this.respondWithResult(res, adCreationResult);
      FacebookLogger.info(`Ad successfully created with ID: ${adCreationResult.id}`);
    } catch (error) {

      this.respondWithError(res, error);
    }
  }

  validateRequiredParameters(req) {
    const { files, body } = req;
    const { adData, campaignData, adsetData, adAccountId } = body;

        const missingParameters = [];

    if (!files || (!files.video && !files.images)) {
      missingParameters.push('files');
    }
    if (!adData) {
      missingParameters.push('adData');
    }
    if (!campaignData) {
      missingParameters.push('campaignData');
    }
    if (!adsetData) {
      missingParameters.push('adsetData');
    }
    if (!adAccountId) {
      missingParameters.push('adAccountId');
    }

    if (missingParameters.length > 0) {
      throw new Error(`Missing required parameters: ${missingParameters.join(', ')}`);
    }
  }

  async getToken(adminsOnly = true) {
    return (await this.userAccountService.getFetchingAccount(adminsOnly)).token;
  }

  getAdAccountId(req) {
    return req.body.adAccountId;
  }

  async getAdAccountsDataMap(adAccountId) {
    // First try to match using provider_id
    let adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ["id", "provider_id", "user_id", "account_id"],
      { provider_id: adAccountId }
    );

    // If no accounts found using provider_id, try to match using id
    if (!adAccounts || adAccounts.length === 0) {
      adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
        ["id", "provider_id", "user_id", "account_id"],
        { id: adAccountId }
      );
    }

    // Key the results by provider_id for easy lookup later
    return _(adAccounts).keyBy("provider_id").value();
  }

  async handleCampaignCreation(req, token, adAccountId, adAccountsDataMap) {
    let campaignData = req.body.campaignData;

    // Check if campaignData is a string and parse it
    if (typeof campaignData === 'string') {
      try {
        campaignData = JSON.parse(campaignData);
      } catch (error) {
        throw new Error("Failed to parse campaignData: " + error.message);
      }
    }

    if (campaignData.existingId) {
      return campaignData.existingId;
    }

    const campaignCreationResult = await this.campaignService.createCampaign(
      token,
      adAccountId,
      campaignData,
      adAccountsDataMap,
    );

    return campaignCreationResult.data.id;
  }

  async handleAdsetCreation(req, token, adAccountId, campaignId, adAccountsDataMap) {
    let adsetData = req.body.adsetData;

    // Check if adsetData is a string and parse it
    if (typeof adsetData === "string") {
      try {
        adsetData = JSON.parse(adsetData);
      } catch (error) {
        throw new Error("Failed to parse adsetData: " + error.message);
      }
    }

    // Add the campaignId to the adsetData object
    adsetData.campaign_id = campaignId;

    // If adsetData has an existingId, return it and skip creation
    if (adsetData.existingId) {
      return adsetData.existingId;
    }

    // Create the ad set with the provided data
    const adSetCreationResult = await this.adsetsService.createAdset(token, adAccountId, adsetData, adAccountsDataMap);

    // Return the ID of the newly created ad set
    return adSetCreationResult.id;
  }

  async handleMediaUploads(req, adAccountId, token) {
    const uploadedMedia = [];

    if (req.files) {
      let firstImageBuffer = null;
      let firstImageName = null;

      // Process Images
      if (req.files["images"]) {
        for (const [index, file] of req.files["images"].entries()) {
          const imageHash = await this.compositeService.uploadImage(file.buffer, file.originalname, adAccountId, token);
          uploadedMedia.push({ type: "image", hash: imageHash["images"][file.originalname].hash });

          // Store the first image to be used as a thumbnail
          if (index === 0) {
            firstImageBuffer = file.buffer;
            firstImageName = file.originalname;
          }
        }
      }

      // Process Videos
      if (req.files["video"]) {
        for (const file of req.files["video"]) {
          let videoHash;
            videoHash = await this.compositeService.uploadVideo(file.buffer, file.originalname, adAccountId, token);

          uploadedMedia.push({ type: "video", video_id: videoHash });
        }
      }
    }
    return uploadedMedia;
  }

  prepareAdData(req, uploadedMedia, adSetId) {
    // Parse adData if it's a string
    let adData = req.body.adData;
    if (typeof adData === "string") {
      try {
        adData = JSON.parse(adData);
      } catch (error) {
        throw new Error("Invalid adData format. Unable to parse adData to JSON.");
      }
    }

    // Check if adData is an object now
    if (typeof adData !== "object" || adData === null) {
      throw new Error("Invalid adData format. adData should be an object.");
    }

    // Parse adData.creative if it's a string
    if (typeof adData.creative === "string") {
      try {
        adData.creative = JSON.parse(adData.creative);
      } catch (error) {
        throw new Error("Invalid adData format. Unable to parse adData.creative to JSON.");
      }
    }

    // Now that we know adData.creative is an object, check for asset_feed_spec
    if (typeof adData.creative.asset_feed_spec === "string") {
      try {
        adData.creative.asset_feed_spec = JSON.parse(adData.creative.asset_feed_spec);
      } catch (error) {
        throw new Error("Invalid adData format. Unable to parse adData.creative.asset_feed_spec to JSON.");
      }
    }

    // // Initialize images array if not already present
    if (!Array.isArray(adData.creative.asset_feed_spec.images)) {
      adData.creative.asset_feed_spec.images = [];
    }

    // Initialize videos array if not already present
    if (!Array.isArray(adData.creative.asset_feed_spec.videos)) {
      adData.creative.asset_feed_spec.videos = [];
    }

    // Add image hashes to the asset_feed_spec.images array
    uploadedMedia.forEach((media) => {

      if (media.type === "image") {
        adData.creative.asset_feed_spec.images.push({ hash: media.hash });
      } else {
        adData.creative.asset_feed_spec.videos.push({
          video_id: media.video_id,
          url_tags: "video=video1",
        });
      }
    });

    // Set the adset_id
    adData.adset_id = adSetId;

    return adData;
  }

  respondWithResult(res, adCreationResult) {
    if (adCreationResult.success) {
      res.json({ success: true, message: "Ad successfully launched in Facebook.", id: adCreationResult.id });
    } else {
      res.status(400).json({ success: false, message: "Failed to create the ad." });
    }
  }

  respondWithError(res, error) {
    // Log any errors encountered during the ad launch process
    FacebookLogger.error(`Error during ad launch: ${error.error_user_msg || error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "An error occurred while launching the ad.",
      error: error.error_user_msg || error.message,
    });
  }

  async routeConversions(req, res) {
    try {
      const body = req.body;
      body.purchase_event_value = body.revenue; delete body.revenue;
      body.purchase_event_count = body.conversions; delete body.conversions;
      body.state = body.region; delete body.region;
      const response = await this.compositeService.routeConversions(body, body.network);
      res.json(response);
    } catch (error) {
      FacebookLogger.error(`Error during routeConversions: ${error.response.data.error.error_user_msg}`);
      console.log({error : error.response.data.error});
      res.status(500).send("Internal Server Error");
    }
  }

  async reportConversions(req, res) {
    try {
      const { date, network } = req.body;
      const result = await this.compositeService.sendCapiEvents(date, network);
      res.json(result);
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  }

}

module.exports = CompositeController;
