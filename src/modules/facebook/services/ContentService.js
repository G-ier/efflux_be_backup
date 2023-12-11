// Third party imports
const axios = require("axios");
const _ = require("lodash");
const FormData = require("form-data");

// Local application imports
const ContentRepository = require("../repositories/ContentRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger"); // Replace with your actual logger
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL } = require("../constants"); // Replace with your actual constants

class ContentService extends BaseService {
  constructor() {
    super(FacebookLogger);
    this.contentRepository = new ContentRepository();
  }

  async createContent(contentData) {
    try {
      // Validate or transform contentData if necessary
      const createdContent = await this.contentRepository.saveOne(contentData);
      return createdContent;
    } catch (error) {
      this.logger.error(`Error creating content: ${error.message}`);
      throw error; // Rethrow the error for further handling if necessary
    }
  }

  // TODO: rename to UploadToFacebook
  // TODO: add a new function to upload the media to S3 bucket

  async UploadToFacebook(imageBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append("file", imageBuffer, filename);
    const url = `${FB_API_URL}act_${adAccountId}/adimages`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(), // form-data handles the Content-Type multipart/form-data header
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      // Create content record for the uploaded image

      const imageContentData = {
        type: "image",
        url: response.data.images[filename].url,
        adAccountId,
        hash: response.data.images[filename].hash,
      };
      await this.createContent(imageContentData);

      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async checkVideoStatus(videoId, token) {
    const statusUrl = `${FB_API_URL}/${videoId}?fields=status&access_token=${token}`;
    try {
      const response = await axios.get(statusUrl);
      return response.data.status.video_status;
    } catch (error) {
      console.error("Error checking video status:", error);
      throw error;
    }
  }

  async uploadVideo(videoBuffer, filename, adAccountId, token) {
    const formData = new FormData();
    formData.append("file", videoBuffer, filename);
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
      while (videoStatus !== "ready") {
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds before checking again
        videoStatus = await this.checkVideoStatus(videoId, token);
      }

      // Create content record for the uploaded video
      const videoContentData = {
        type: "video",
        url: response.data.someVideoUrlField, // Adjust according to actual response
        adAccountId,
        // other relevant data
      };
      await this.createContent(videoContentData);

      return videoId;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  }

  async handleMediaUploads(req, adAccountId, token, existingContentIds = []) {
    const uploadedMedia = [];
    const createdMediaObjects = [];

    // Process existing content IDs
    if (existingContentIds && existingContentIds.length > 0) {
      for (const contentId of existingContentIds) {
        try {
          const existingContent = await this.fetchContentFromDB(["*"], { id: contentId });
          if (existingContent && existingContent.length > 0) {
            const content = existingContent[0];
            if (content.type === "image") {
              uploadedMedia.push({ type: content.type, hash: content.hash });
            } else if (content.type === "video") {
              uploadedMedia.push({ type: content.type, video_id: content.video_id });
            } else {
              console.warn(`Unsupported content type for ID: ${contentId}`);
            }
          } else {
            console.warn(`No content found for ID: ${contentId}`);
          }
        } catch (error) {
          console.error(`Error fetching content for ID ${contentId}:`, error);
        }
      }
    }

    // Process new uploads (Images and Videos)
    if (req.files) {
      // Process Images
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const imageHash = await this.uploadImage(file.buffer, file.originalname, adAccountId, token);
          const createdImage = await this.createContent({
            type: "image",
            hash: imageHash["images"][file.originalname].hash,
            url: imageHash["images"][file.originalname].url,
            ad_account_id: adAccountId,
            // Include additional fields as needed
          });
          console.log({ createdImage });
          uploadedMedia.push({ type: "image", hash: createdImage.hash });
          createdMediaObjects.push(createdImage); // Push the entire created record
        }
      }

      // Process Videos
      if (req.files["video"]) {
        for (const file of req.files["video"]) {
          const videoHash = await this.uploadVideo(file.buffer, file.originalname, adAccountId, token);
          const createdVideo = await this.createContent({
            type: "video",
            video_id: videoHash,
            url: imageHash["videos"][file.originalname].url,
            ad_account_id: adAccountId,
          });
          uploadedMedia.push({ type: "video", video_id: createdVideo.video_id });
          createdMediaObjects.push(createdVideo); // Push the entire created record
        }
      }
    }

    return { uploadedMedia, createdMediaObjects };
  }

  async fetchContentFromDB(fields = ["*"], filters = {}, limit) {
    const results = await this.pageRepository.fetchPages(fields, filters, limit);
    return results;
  }
}

module.exports = ContentService;
