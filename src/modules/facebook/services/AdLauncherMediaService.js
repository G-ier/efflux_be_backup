// Third party imports
const axios = require('axios');
const _ = require('lodash');
const FormData = require('form-data');
const async = require('async'); // Ensure async is imported

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
  async uploadToMediaLibrary(
    type,
    imageBuffer,
    filename,
    adAccountId,
    mediaUrlOnNetwork,
    userId,
    adsetData,
  ) {
    const formData = new FormData();

    const parsedAdsetData = JSON.parse(adsetData);
    console.debug('ILYAS-TEST: country_code');
    console.debug(parsedAdsetData.targeting.geo_locations.countries[0]);

    console.debug('ILYAS-TEST: platform');
    console.debug(parsedAdsetData.targeting.publisher_platforms[0]);

    formData.append('media_file', imageBuffer, filename);
    formData.append('ad_account_id', adAccountId);
    formData.append('type', type);
    formData.append(
      'country_code',
      parsedAdsetData.targeting.geo_locations.countries[0].toUpperCase(),
    );
    formData.append('platform', parsedAdsetData.targeting.publisher_platforms[0]);
    formData.append('language_code', 'FR'); // TODO: Replace with actual language code
    formData.append('media_url_on_network', mediaUrlOnNetwork);
    formData.append('user_id', userId);

    const url =
      process.env.MEDIA_LIBRARY_SERVICE_ENDPOINT + '/upload' ||
      'https://3j31rv1m1m.execute-api.us-east-1.amazonaws.com/upload';

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data handles the Content-Type multipart/form-data header
        },
      });

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
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      return response.data.id; // Just return the video ID
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }
  
  async handleMediaUploads(req, adAccountId, token, existingContentIds = []) {
    const uploadedMedia = [];
    const createdMediaObjects = [];
    // Remove undefined elements from existingContentIds
    const filteredExistingContentIds = existingContentIds.filter((id) => id !== undefined);

    // Process existing content IDs
    await this.processExistingContentIds(filteredExistingContentIds, uploadedMedia);


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
    console.log('Processing new uploads...');

    // Process Images
    if (req.files['images']) {
      await this.processImages(
        req.files['images'],
        adAccountId,
        token,
        uploadedMedia,
        createdMediaObjects,
        req.user,
        req.body.adsetData,
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
        req.user,
      );
    }
  }

  async processImages(
    images,
    adAccountId,
    token,
    uploadedMedia,
    createdMediaObjects,
    user,
    adsetData,
  ) {
    for (const file of images) {
      const imageHash = await this.uploadToFacebook(
        file.buffer,
        file.originalname,
        adAccountId,
        token,
      );

      const createdImage = await this.createContent({
        type: 'image',
        hash: imageHash['images'][file.originalname].hash,
        url: imageHash['images'][file.originalname].url,
        ad_account_id: adAccountId,
      });

      uploadedMedia.push({ type: 'image', hash: createdImage.hash });

      // await this.uploadToMediaLibrary(
      //   'image',
      //   file.buffer,
      //   file.originalname,
      //   adAccountId,
      //   imageHash['images'][file.originalname].url,
      //   user.id,
      //   adsetData,
      // );

      createdMediaObjects.push(createdImage);

      // Calls the media-library microservice to upload the image to S3 and store the metadata in dynamodb
    }
  }

  async processVideos(videos, adAccountId, token, uploadedMedia, createdMediaObjects, user, adsetData) {
    const MAX_CONCURRENT_UPLOADS = 10; // Adjust based on your requirements
    
    // Function to handle individual video upload
    const uploadVideo = async (file) => {
      const videoHash = await this.uploadVideo(file.buffer, file.originalname, adAccountId, token);
      uploadedMedia.push({ type: 'video', video_id: videoHash });
      return videoHash;
    };
    
    // Concurrently upload videos
    await async.mapLimit(videos, MAX_CONCURRENT_UPLOADS, async (file) => {
      return uploadVideo(file);
    });
  
    let videoIdsToCheck = uploadedMedia.map(video => video.video_id).filter(id => id);
    let videoStatuses;

    while (videoIdsToCheck.length > 0) {
        videoStatuses = await this.batchCheckVideoStatus(videoIdsToCheck, adAccountId, token);
        
        // Update the list of videos that are still not ready
        videoIdsToCheck = videoStatuses.filter(video => video.status !== 'ready').map(video => video.id);

        if (videoIdsToCheck.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 20000)); // Wait before checking again
        }
    }

    // Process videos that are ready
    for (const video of videoStatuses) {
        const createdVideo = await this.createContent({
            type: 'video',
            hash: video.id,
            url: 'empty',
            ad_account_id: adAccountId,
        });
        createdMediaObjects.push(createdVideo);
        console.log(`Video hash: ${video.id} is ready and content created.`);
    }
    
    console.log('Created media objects for all ready videos.');
}

  
async batchCheckVideoStatus(videoIds, adAccountId, token) {

  const batchRequests = videoIds.map(videoId => ({
      method: 'GET',
      relative_url: `${videoId}?fields=status`
  }));

  try {
      const response = await axios.post(FB_API_URL, {
          access_token: token,
          batch: JSON.stringify(batchRequests)
      });

      // Parse each response to extract video status
      return response.data.map(item => {
          if (item.code === 200) {
              const content = JSON.parse(item.body);
              const videoStatus = content?.status?.video_status;
              return { id: content.id, status: videoStatus };
          } else {
              const errorContent = JSON.parse(item.body);
              console.error(`Error checking status for video: ${errorContent.error.message}`);
          }
      });
  } catch (error) {
      console.error('Error in batch request:', error);
      throw error;
  }
}


  async fetchContentFromDB(fields = ['*'], filters = {}, limit) {
    const results = await this.adLauncherMediaRepository.fetchContents(fields, filters, limit);
    return results;
  }
}

module.exports = AdLauncherMedia;
