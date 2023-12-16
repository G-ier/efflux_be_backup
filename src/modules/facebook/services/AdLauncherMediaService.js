// Third party imports
const axios = require('axios');
const _ = require('lodash');
const FormData = require('form-data');

// Local application imports
const AdLauncherMediaRepository = require('../repositories/AdLauncherMediaRepository');
const { FacebookLogger } = require('../../../shared/lib/WinstonLogger'); // Replace with your actual logger
const BaseService = require('../../../shared/services/BaseService');
const { FB_API_URL } = require('../constants'); // Replace with your actual constants

class AdLauncherMedia extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.adLauncherMediaRepository = new AdLauncherMediaRepository();
  }

  async createContent(contentData) {
    try {
      // Validate or transform contentData if necessary
      const createdContent = await this.adLauncherMediaRepository.saveOne(contentData);
      return createdContent;
    } catch (error) {
      this.logger.error(`Error creating content: ${error.message}`);
      throw error; // Rethrow the error for further handling if necessary
    }
  }

  // function to upload the media to S3 bucket
  async uploadToMediaLibrary(imageBuffer, filename, adAccountId, token) {
    const formData = new FormData();

    formData.append('media_file', imageBuffer, filename);
    formData.append('ad_account_id', adAccountId);
    formData.append('ad_id', '123456789'); // TODO: Replace with actual ad ID
    formData.append('country_code', 'CA'); // TODO: Replace with actual country code
    formData.append('language_code', 'FR'); // TODO: Replace with actual language code
    formData.append('vertical', 'ecommerce'); // TODO: Replace with actual vertical
    formData.append('industry', 'ecommerce'); // TODO: Replace with actual industry
    formData.append('user_id', '123456789'); // TODO: Replace with actual user ID from session

    const url = 'https://u1yua8b7cf.execute-api.us-east-1.amazonaws.com/upload';

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data handles the Content-Type multipart/form-data header
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading image to media library: ', error);
      throw error;
    }
  }

  async uploadToFacebook(imageBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append('file', imageBuffer, filename);
    const url = `${FB_API_URL}act_${adAccountId}/adimages`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data handles the Content-Type multipart/form-data header
          Authorization: `Bearer ${token}`,
        },
      });

      // Create content record for the uploaded image

      const imageContentData = {
        type: 'image',
        url: response.data.images[filename].url,
        adAccountId,
        hash: response.data.images[filename].hash,
      };
      await this.createContent(imageContentData);

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async checkVideoStatus(videoId, token) {
    const statusUrl = `${FB_API_URL}/${videoId}?fields=status&access_token=${token}`;
    try {
      const response = await axios.get(statusUrl);
      return response.data.status.video_status;
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  }

  async uploadVideo(videoBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append('file', videoBuffer, filename);
    const url = `${FB_API_URL}/act_${adAccountId}/advideos`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data handles the Content-Type multipart/form-data header
          Authorization: `Bearer ${token}`,
        },
      });
      const videoId = response.data.id;

      // Check video status until it's ready
      let videoStatus = await this.checkVideoStatus(videoId, token);
      while (videoStatus !== 'ready') {
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds before checking again
        videoStatus = await this.checkVideoStatus(videoId, token);
      }

      // Create content record for the uploaded video
      const videoContentData = {
        type: 'video',
        url: response.data.someVideoUrlField, // Adjust according to actual response
        adAccountId,
        // other relevant data
      };
      await this.createContent(videoContentData);

      return videoId;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  async handleMediaUploads(req, adAccountId, token, existingContentIds = []) {
    const uploadedMedia = [];
    const createdMediaObjects = [];

    // Process existing content IDs
    await this.processExistingContentIds(existingContentIds, uploadedMedia);

    // Process new uploads (Images and Videos)
    if (req.files) {
      await this.processNewUploads(req, adAccountId, token, uploadedMedia, createdMediaObjects);
    }
    return { uploadedMedia, createdMediaObjects };
  }

  async processExistingContentIds(existingContentIds, uploadedMedia) {
    if (existingContentIds && existingContentIds.length > 0) {
      for (const contentId of existingContentIds) {
        try {
          const content = await this.fetchAndValidateContent(contentId);
          if (content) {
            this.addToUploadedMedia(content, uploadedMedia);
          }
        } catch (error) {
          console.error(`Error fetching content for ID ${contentId}:`, error);
        }
      }
    }
  }

  async fetchAndValidateContent(contentId) {
    const existingContent = await this.fetchContentFromDB(['*'], { id: contentId });
    if (existingContent && existingContent.length > 0) {
      return existingContent[0];
    } else {
      console.warn(`No content found for ID: ${contentId}`);
      return null;
    }
  }

  addToUploadedMedia(content, uploadedMedia) {
    if (content.type === 'image') {
      uploadedMedia.push({ type: content.type, hash: content.hash });
    } else if (content.type === 'video') {
      uploadedMedia.push({ type: content.type, video_id: content.video_id });
    } else {
      console.warn(`Unsupported content type for ID: ${content.id}`);
    }
  }

  async processNewUploads(req, adAccountId, token, uploadedMedia, createdMediaObjects) {
    // Process Images
    if (req.files['images']) {
      await this.processImages(
        req.files['images'],
        adAccountId,
        token,
        uploadedMedia,
        createdMediaObjects,
      );
    }

    // Process Videos
    if (req.files['video']) {
      await this.processVideos(
        req.files['video'],
        adAccountId,
        token,
        uploadedMedia,
        createdMediaObjects,
      );
    }
  }

  async processImages(images, adAccountId, token, uploadedMedia, createdMediaObjects) {
    for (const file of images) {
      const imageHash = await this.uploadToFacebook(
        file.buffer,
        file.originalname,
        adAccountId,
        token,
      );

      // Calls the media-library microservice to upload the image to S3 and store the metadata in dynamodb
      const imageId = await this.uploadToMediaLibrary(
        file.buffer,
        file.originalname,
        adAccountId,
        imageHash['images'][file.originalname].hash,
      );

      const createdImage = await this.createContent({
        type: 'image',
        hash: imageHash['images'][file.originalname].hash,
        url: imageHash['images'][file.originalname].url,
        ad_account_id: adAccountId,
      });
      uploadedMedia.push({ type: 'image', hash: createdImage.hash });
      createdMediaObjects.push(createdImage);
    }
  }

  async processVideos(videos, adAccountId, token, uploadedMedia, createdMediaObjects) {
    for (const file of videos) {
      const videoHash = await this.uploadVideo(file.buffer, file.originalname, adAccountId, token);
      const createdVideo = await this.createContent({
        type: 'video',
        video_id: videoHash,
        url: imageHash['videos'][file.originalname].url,
        ad_account_id: adAccountId,
      });
      uploadedMedia.push({ type: 'video', video_id: createdVideo.video_id });
      createdMediaObjects.push(createdVideo);
    }
  }

  async fetchContentFromDB(fields = ['*'], filters = {}, limit) {
    const results = await this.adLauncherMediaRepository.fetchContents(fields, filters, limit);
    return results;
  }
}

module.exports = AdLauncherMedia;
