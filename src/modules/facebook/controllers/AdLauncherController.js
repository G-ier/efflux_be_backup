// Local application imports
const AdLauncherService = require('../services/AdLauncherService'); // Make sure to create this service
const { parseJsonOrDefault } = require('../helpers');
const AdsetsService = require('../services/AdsetsService');
const AdAccountService = require('../services/AdAccountService');
const CampaignService = require('../services/CampaignsService');
const UserAccountService = require('../services/UserAccountService');
const dynamoDbService = require('../../../shared/lib/DynamoDBService');
const AdLauncherMedia = require('../services/AdLauncherMediaService');
const CompositeService = require('../services/CompositeService');
const AdQueueService = require('../services/AdQueueService');
const { FacebookLogger } = require('../../../shared/lib/WinstonLogger');
const { notifyUser } = require('../../../shared/lib/NotificationsService');
const _ = require('lodash');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const PixelsService = require('../services/PixelsService');
const PageService = require('../services/PageService');

class AdLauncherController {
  constructor() {
    this.adLauncherService = new AdLauncherService();
    this.adsetsService = new AdsetsService();
    this.adAccountService = new AdAccountService();
    this.campaignService = new CampaignService();
    this.userAccountService = new UserAccountService();
    this.adLauncherMedia = new AdLauncherMedia();
    this.adQueueService = new AdQueueService();
    this.compositeService = new CompositeService();
    this.pixelService = new PixelsService();
    this.pageService = new PageService();
    this.ddbRepository = dynamoDbService;
  }

  validateAllParameters(req, res) {
    const payload = req.body;

    const requiredKeys = ['adAccountId', 'campaignData', 'adsetData', 'adData', 'url'];
    const campaignDataKeys = ['name', 'objective', 'special_ad_categories', 'category', 'vertical'];
    const adsetDataKeys = [
      'name',
      'daily_budget',
      'billing_event',
      'optimization_goal',
      'bid_strategy',
      'attribution_spec',
      'targeting',
      'promoted_object',
      'start_time',
    ];
    const adDataKeys = ['name', 'status', 'creative'];

    for (const key of requiredKeys) {
      if (!payload.hasOwnProperty(key)) {
        return res.status(403).json({
          success: false,
          message: `Missing required parameter: ${key}`,
        });
      }
    }

    for (const key of campaignDataKeys) {
      if (!payload.campaignData.hasOwnProperty(key)) {
        return res.status(403).json({
          success: false,
          message: `Missing required parameter: campaignData: ${key}`,
        });
      }
    }

    for (const key of adsetDataKeys) {
      if (!payload.adsetData.hasOwnProperty(key)) {
        return res.status(403).json({
          success: false,
          message: `Missing required parameter: adsetDataKeys: ${key}`,
        });
      }
    }

    for (const key of adDataKeys) {
      if (!payload.adData.hasOwnProperty(key)) {
        return res.status(403).json({
          success: false,
          message: `Missing required parameter: adDataKeys: ${key}`,
        });
      }
    }
    // Additional deep checks can be added here if necessary for nested objects like targeting, creative, etc.

    return true; // Payload is valid
  }

  getAdAccountId(req) {
    return req.body.adAccountId;
  }

  constructTargetUrl(data) {
    const url = data.url;
    const adtitle = data.adTxt;
    const pixel_id = data.adsetData.promoted_object.pixel_id;
    const queryParams = `?subid1={*user-agent*}&subid2=${pixel_id}_|_{{campaign.id}}_|_{{adset.id}}_|_{{ad.id}}_|_facebook_|_{external}&subid3={*session-id*}&subid4={*user-ip*}_|_{*country-code*}_|_{*region*}_|_{*city*}_|_{*timestamp*}_|_{{campaign.name}}&adtitle=${adtitle}`;
    return `${url}${queryParams}`;
  }

  /**
   * Saves the campaign data to DynamoDB table as a template for future use
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} - Response object
   * @async
   **/
  async saveCampaignTemplate(req, res) {
    FacebookLogger.info('Saving campaign template to dynamo db table.');

    // Validate the request body
    this.validateAllParameters(req, res);

    console.log('Request body:', req.body);
    FacebookLogger.info(`Request body: ${req.body}`);

    try {
      // add createdAt timestamp to the request body
      req.body.createdAt = new Date().toISOString();

      // add random id to the request body using uuid
      req.body.id = uuidv4().toString();

      // add templateName to the request body
      req.body.templateName = req.body.campaignData.name;

      // make sure userId is a string
      req.body.userId = req.user.id.toString();

      // delete internal_campaign_id, status, url from the request body
      delete req.body.internal_campaign_id;
      delete req.body.status;
      delete req.body.url;

      await this.ddbRepository.putItem('campaign-templates', req.body);

      return res.json({
        success: true,
        message: 'Campaign template successfully saved',
      });
    } catch (error) {
      FacebookLogger.error(`Error saving campaign template to dynamo db ${JSON.stringify(error)}`);
      return res.status(500).json({
        success: false,
        message: 'Error saving campaign template to dynamo db',
        error: error.message,
      });
    }
  }

  /**
   * Fetches all campaign templates for the current user from DynamoDB table
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} - Response object
   **/
  async fetchCampaignTemplates(req, res) {
    console.log('Fetching campaign templates from dynamo db table.');
    FacebookLogger.info('Fetching campaign templates from dynamo db table.');

    const userId = req.user.id.toString();
    console.log('Request user ID:', userId);
    if (!userId) {
      return res.status(403).json({
        success: false,
        message: 'User ID not found in request',
      });
    }

    try {
      const templates = await this.ddbRepository.queryItems('campaign-templates', {
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      return res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      FacebookLogger.error(`Error fetching campaign templates ${JSON.stringify(error)}`);
      return res.status(500).json({
        success: false,
        message: 'Error fetching campaign templates',
        error: error.message,
      });
    }
  }

  /**
   * Fetches a campaign template by id from DynamoDB table
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} - Response object
   **/
  async fetchCampaignTemplateById(req, res) {
    FacebookLogger.info('Fetching campaign template by id from dynamo db table.');

    const templateId = req.params.templateId.toString();
    console.log('Request template ID:', templateId);

    try {
      const template = await this.ddbRepository.getItem('campaign-templates', 'id', templateId);

      return res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      FacebookLogger.error(`Error fetching campaign template by id ${JSON.stringify(error)}`);
      return res.status(500).json({
        success: false,
        message: 'Error fetching campaign template by id',
        error: error.message,
      });
    }
  }

  /**
   * Pushes the draft campaign data to DynamoDB table
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Promise<Object>} - Response object
   **/
  async pushDraftToDynamo(req, res) {
    FacebookLogger.info('Pushing in progress data to dynamo db table.');

    // Validate the request body
    this.validateAllParameters(req, res);

    FacebookLogger.info(`Request body: ${req.body}`);

    const finalTargetUrl = this.constructTargetUrl(req.body);

    // Write a logic here - handle both dynamic creatives and non dynamic creatives - ASSUMING SINGLE IMAGE UPLOAD
    if (req.body.adsetData.is_dynamic_creative) {
      req.body.adData.creative.asset_feed_spec.link_urls = [{ website_url: finalTargetUrl }];
    } else {
      req.body.adData.creative.object_story_spec.link_data.link = finalTargetUrl;
    }

    FacebookLogger.info(`Final Request Body ${JSON.stringify(req.body)}`);

    try {
      // add createdAt timestamp to the request body
      req.body.createdAt = new Date().toISOString();

      await this.ddbRepository.putItem('in-progress-campaigns', req.body);

      const rocketKey = req.body.url.split('/')[1];
      // Save target to dynamo db
      await this.ddbRepository.putItem('edge-rocket-targets', {
        key: rocketKey,
        internal_campaign_id: req.body.internal_campaign_id,
        destination_url: `https://${req.body.destinationDomain}`,
      });

      return res.json({
        success: true,
        message: 'Data pushed to dynamo db successfully',
      });
    } catch (error) {
      FacebookLogger.error(`Error pushing data to dynamo db ${JSON.stringify(error)}`);
      return res.status(500).json({
        success: false,
        message: 'Error pushing data to dynamo db',
        error: error.message,
      });
    }
  }

  async launchAd(req, res) {
    // Validate the request body
    this.validateAllParameters(req, res);

    const adAccountsDataMap = await this.getAdAccountsDataMap(req.body.adAccountId);
    const adAccountId = Object.keys(adAccountsDataMap)[0];
    const adAccountName = adAccountsDataMap[adAccountId].name;
    const { token, userAccountName } = await this.getToken(adAccountsDataMap[adAccountId].id);

    FacebookLogger.info(`Facebook User Account Being Used To Launch: ${userAccountName}`);

    // STEP 0: Create a campaign
    let newCampaign;
    try {
      newCampaign = await this.adLauncherService.createCampaign(
        req.body.campaignData,
        adAccountId,
        token,
      );
      FacebookLogger.info(`New Campaign Id ${newCampaign}`);
    } catch (error) {
      FacebookLogger.error(`Error creating campaign ${JSON.stringify(error)}`);
      return {
        success: false,
        message: 'Error creating campaign',
        error: error.error_user_title
          ? `
          Launching with ${adAccountName}
          ${error.error_user_title}
          ${error.error_user_msg}
        `
          : error.message,
      };
    }

    // STEP 1: Create dynamic adset
    const adsetData = req.body.adsetData;
    const campaignId = newCampaign.id;
    const adData = req.body.adData;

    let newAdset;
    try {
      newAdset = await this.adLauncherService.createAdset(
        adsetData,
        adAccountId,
        token,
        campaignId,
        adData,
      );
      FacebookLogger.info(`New Adset Id ${newAdset}`);
    } catch (error) {
      FacebookLogger.error(`Error creating adset ${JSON.stringify(error)}`);
      return {
        success: false,
        message: 'Error creating adset',
        error: error.error_user_title
          ? `
          Launching with ${adAccountName}
          ${error.error_user_title}
          ${error.error_user_msg}
        `
          : error.message,
      };
    }

    // STEP 2: Create a Dynamic Ad Creatives
    let adcreatives;
    try {
      adcreatives = await this.adLauncherService.createDynamicAdCreative(
        req.body.adData.creative,
        token,
        adAccountId,
        req.body.adsetData,
      );

      FacebookLogger.info(`New Ad Creative Id ${adcreatives}`);
    } catch (error) {
      FacebookLogger.error(`Error creating ad creative ${JSON.stringify(error)}`);
      return {
        success: false,
        message: 'Error creating ad creative',
        error: error.error_user_title
          ? `
          Launching with ${adAccountName}
          ${error.error_user_title}
          ${error.error_user_msg}
        `
          : error.message,
      };
    }

    // STEP 3: Create an ad
    let newAd;
    try {
      newAd = await this.adLauncherService.createNewAd(
        req.body.adData.name,
        newAdset.id,
        adcreatives.id,
        adAccountId,
        token,
      );
      FacebookLogger.info(`New Ad Id ${newAd.id}`);
      return res.json({
        success: true,
        message: 'Ad created successfully',
      });
      return {
        success: true,
        message: 'Ad created successfully',
      };
    } catch (error) {
      FacebookLogger.error(`Error creating ad ${JSON.stringify(error)}`);
      console.log('Error creating ad ---?>', error);
      return {
        success: false,
        message: 'Error creating ad',
        error: error.message,
      };
    }
  }

  async launchAdOld(req, res) {
    let accountName, pixel, page, adAccountName;
    try {
      const pixelId = req.body.pixel_id?.toString();
      const pageId = req.body.page_id?.toString();

      const timerLabel = 'launchAdExecutionTime';
      console.time(timerLabel); // Start the timer
      const existingLaunchId = req?.body?.existingLaunchId;

      //Extracting the url of the ad
      const existingContentIds = req.body.existingContentIds;
      const contentIds = Array.isArray(existingContentIds)
        ? existingContentIds
        : [existingContentIds];

      FacebookLogger.info('Ad launch process initiated.');
      this.validateRequiredParameters(req);
      const adAccountId = this.getAdAccountId(req);
      const adAccountsDataMap = await this.getAdAccountsDataMap(adAccountId);
      const firstKey = Object.keys(adAccountsDataMap)[0];
      adAccountName = adAccountsDataMap[firstKey]?.name;

      const { token, userAccountName } = await this.getToken(adAccountsDataMap[firstKey].id);
      accountName = userAccountName;

      pixel = (await this.pixelService.fetchPixelsByPixelId(['*'], { pixel_id: pixelId }, 1))[0];
      page = (await this.pageService.fetchPageById(['*'], { id: pageId }, 1))[0];

      // Log the start of campaign creation
      FacebookLogger.info('Starting campaign creation.');
      const campaignId = await this.handleCampaignCreation(req, token, firstKey, adAccountsDataMap);
      FacebookLogger.info(`Campaign created with ID: ${campaignId}`);

      // Log the start of ad set creation
      FacebookLogger.info('Starting ad set creation.');
      const adSetId = await this.handleAdsetCreation(
        req,
        token,
        firstKey,
        campaignId,
        adAccountsDataMap,
      );
      FacebookLogger.info(`Ad Set created with ID: ${adSetId}`);

      // Utilize handleMediaUploads from ContentService
      FacebookLogger.info('Starting media uploads.');
      const { uploadedMedia, createdMediaObjects } = await this.adLauncherMedia.handleMediaUploads(
        req,
        firstKey,
        token,
        contentIds,
      );

      FacebookLogger.info(`Media uploaded: ${JSON.stringify(uploadedMedia)}`);

      // Retrieve the initial URL
      let url = req.body.url;

      // Replace the placeholders with actual values
      url = url?.replace('{CAMPAIGN_ID}', campaignId).replace('{ADSET_ID}', adSetId);
      // Log the start of ad data preparation
      FacebookLogger.info('Preparing ad data.');
      const adData = this.prepareAdData(req, uploadedMedia, adSetId, url);

      // Log the start of ad creation
      FacebookLogger.info('Starting ad creation.');
      const adCreationResult = await this.adLauncherService.createAd({
        token,
        adAccountId: firstKey,
        adData,
      });

      // Log the successful creation of an ad
      console.timeEnd(timerLabel); // Stop the timer after function execution
      this.respondWithResult(res, adCreationResult);
      FacebookLogger.info(`Ad successfully created with ID: ${adCreationResult.id}`);
      notifyUser(
        'Ad Launch Successful',
        `Ad ${adData.name} created with ID: ${adCreationResult.id}`,
        req.user.id,
      );
    } catch (error) {
      console.timeEnd('launchAdExecutionTime'); // Stop the timer after function execution
      this.respondWithError(res, { error, pixel, page, accountName, adAccountName });
    }
  }

  validateRequiredParameters(req) {
    const { files, body } = req;
    const { adData, campaignData, adsetData, adAccountId, existingContentIds } = body;

    const missingParameters = [];

    // Check for files only if existingContentIds are not provided or empty
    if (
      (!existingContentIds || existingContentIds.length === 0) &&
      (!files || (!files.video && !files.images))
    ) {
      missingParameters.push('files or existingContentIds');
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

  async getToken(entityId) {
    const details = await this.compositeService.fetchEntitiesOwnerByAdAccounts(entityId);
    return { token: details?.token, userAccountName: details?.name };
  }

  getAdAccountId(req) {
    return req.body.adAccountId;
  }

  async getAdAccountsDataMap(adAccountId) {
    // First try to match using provider_id
    let adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
      ['id', 'provider_id', 'name'],
      { provider_id: adAccountId },
    );

    // If no accounts found using provider_id, try to match using id
    if (!adAccounts || adAccounts.length === 0) {
      adAccounts = await this.adAccountService.fetchAdAccountsFromDatabase(
        ['id', 'provider_id', 'name'],
        {
          id: adAccountId,
        },
      );
    }

    // Key the results by provider_id for easy lookup later
    return _(adAccounts).keyBy('provider_id').value();
  }

  async handleCampaignCreation(req, token, adAccountId, adAccountsDataMap) {
    let campaignData = req.body.campaignData;

    campaignData = parseJsonOrDefault(campaignData);

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

    adsetData = parseJsonOrDefault(adsetData);

    // Add the campaignId to the adsetData object
    adsetData.campaign_id = campaignId;

    // If adsetData has an existingId, return it and skip creation
    if (adsetData.existingId) {
      return adsetData.existingId;
    }

    // Create the ad set with the provided data
    const adSetCreationResult = await this.adsetsService.createAdset(
      token,
      adAccountId,
      adsetData,
      adAccountsDataMap,
    );

    // Return the ID of the newly created ad set
    return adSetCreationResult.id;
  }

  async handleMediaUploads(req, res) {
    try {
      const token = await this.getToken();
      const adAccountId = this.getAdAccountId(req); // Ensure adAccountId is retrieved correctly
      const adAccountsDataMap = await this.getAdAccountsDataMap(adAccountId);
      const firstKey = Object.keys(adAccountsDataMap)[0];

      // Call handleMediaUploads from ContentService
      const uploadedMedia = await this.contentService.handleMediaUploads(req, firstKey, token);

      // Return the uploaded media data as a response
      res.json({ success: true, uploadedMedia });
    } catch (error) {
      // Handle any errors that occur during the process
      console.error(`Error in handleMediaUploads: ${error.message}`, error);
      res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  prepareAdData(req, uploadedMedia, adSetId, newUrl) {
    // Parse adData if it's a string
    let adData = req.body.adData;

    adData = parseJsonOrDefault(adData);

    // Check if adData is an object now
    if (typeof adData !== 'object' || adData === null) {
      throw new Error('Invalid adData format. adData should be an object.');
    }

    // Parse adData.creative if it's a string
    if (typeof adData.creative === 'string') {
      try {
        adData.creative = JSON.parse(adData.creative);
      } catch (error) {
        throw new Error('Invalid adData format. Unable to parse adData.creative to JSON.');
      }
    }

    // Now that we know adData.creative is an object, check for asset_feed_spec
    if (typeof adData.creative.asset_feed_spec === 'string') {
      try {
        adData.creative.asset_feed_spec = JSON.parse(adData.creative.asset_feed_spec);
      } catch (error) {
        throw new Error(
          'Invalid adData format. Unable to parse adData.creative.asset_feed_spec to JSON.',
        );
      }
    }

    adData.creative.asset_feed_spec.link_urls = [{ website_url: newUrl }];

    // Initialize images array if not already present
    if (!Array.isArray(adData.creative.asset_feed_spec.images)) {
      adData.creative.asset_feed_spec.images = [];
    }

    // Initialize videos array if not already present
    if (!Array.isArray(adData.creative.asset_feed_spec.videos)) {
      adData.creative.asset_feed_spec.videos = [];
    }

    // Add image hashes to the asset_feed_spec.images array
    uploadedMedia.forEach((media) => {
      if (media.type === 'image') {
        adData.creative.asset_feed_spec.images.push({ hash: media.hash });
      } else {
        adData.creative.asset_feed_spec.videos.push({
          video_id: media.video_id,
          url_tags: 'video=video1',
        });
      }
    });

    // Set the adset_id
    adData.adset_id = adSetId;

    return adData;
  }

  respondWithResult(res, adCreationResult) {
    if (adCreationResult.success) {
      res.json({
        success: true,
        message: 'Ad successfully launched in Facebook.',
        id: adCreationResult.id,
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to create the ad.' });
    }
  }

  async uploadVideoToFacebook(req, res) {
    try {
      if (!req.file) {
        throw new Error('No video file uploaded.');
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
      res.status(500).send(error.message || 'Internal Server Error');
    }
  }

  async uploadImageToFacebook(req, res) {
    try {
      if (!req.file) {
        throw new Error('No image file uploaded.');
      }

      const adAccountId = req.body.adAccountId; // You can pass adAccountId in the form data
      const admins_only = true;
      const { token } = await this.userAccountService.getFetchingAccount(admins_only);

      // Pass the buffer, filename, adAccountId, and token to the uploadImage function
      const imageHash = await this.contentService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        adAccountId,
        token,
      );

      res.status(200).json({ imageHash });
    } catch (error) {
      res.status(500).send(error.message || 'Internal Server Error');
    }
  }

  respondWithError(res, { error, pixel, page, accountName, adAccountName }) {
    // Define a mapping of error codes and subcodes to custom messages
    const errorMessagesMap = {
      '10_1341012': {
        message: [
          `Please`,
          {
            bold: ` assign ${accountName || 'the account'} profile to the ${
              page ? page.name : 'specified page'
            }  on your Business Manager`,
          },
          ` and try again. If you lack access to the BM or Profile, please contact one of your managers.`,
        ],
      },
      '200_1815045': {
        message: [
          `Please`,
          {
            bold: ` assign ${adAccountName || 'the specific'} ad account to the ${
              pixel ? pixel.name : 'specified'
            } pixel/dataset on your Business Manager `,
          },
          `and try again. If you lack access to the BM or Profile, please contact one of your managers.`,
        ],
      },
    };

    // Construct the error key to look up in the map
    const errorKey = `${error.code}_${error.error_subcode}`;

    // Use the custom message if available, otherwise fallback to a generic message
    let customMessage =
      errorMessagesMap[errorKey] ||
      `Error during ad launch for account ${accountName || 'Unknown'}: ${
        error?.error_user_msg || error.message
      }`;

    // Log the error with additional context
    FacebookLogger.error(customMessage, {
      error,
      pixel: pixel ? JSON.stringify(pixel) : 'N/A',
      page: page ? JSON.stringify(page) : 'N/A',
      accountName: accountName || 'Unknown',
    });

    // Respond with the error and additional details
    const statusCode = error.code === 200 ? 400 : 500; // Use HTTP 400 for client errors represented by HTTP 200 status in FB API
    res.status(statusCode).json({
      success: false,
      message: customMessage,
      errorDetails: {
        errorCode: error.code,
        errorSubcode: error.error_subcode,
        errorData: error.error_data ? JSON.parse(error.error_data) : {},
      },
    });
  }
}

module.exports = AdLauncherController;
