const _ = require('lodash');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const db = require('../data/dbConfig')


class CreativeManager {

  static root_dir = path.resolve(__dirname, '..');

  static download_image(image_url, download_path, image_name) {
    return new Promise((resolve, reject) => {
        try {
            // Ensure the directory exists
            fs.mkdirSync(download_path, { recursive: true });
            const filePath = path.join(download_path, image_name);

            // Send a GET request
            axios({
                method: 'GET',
                url: image_url,
                responseType: 'stream'
            }).then(response => {
                const writer = fs.createWriteStream(filePath);

                // Pipe the response stream to the file
                response.data.pipe(writer);

                // Wait for the file stream to finish
                writer.on('finish', () => {
                    console.log('Downloaded the image successfully.');
                    resolve();
                });
                writer.on('error', reject);
            });

        } catch (error) {
            console.error(`Error downloading image: ${error}`);
            reject(error);
        }
    });
  }

  static download_video(video_url, download_path, image_name) {
      return new Promise((resolve, reject) => {
          try {
              // Ensure the directory exists
              fs.mkdirSync(download_path, { recursive: true });
              const filePath = path.join(download_path, image_name);

              // Send a GET request
              axios({
                  method: 'GET',
                  url: video_url,
                  responseType: 'stream'
              }).then(response => {
                  const writer = fs.createWriteStream(filePath);

                  // Pipe the response stream to the file
                  response.data.pipe(writer);

                  // Wait for the file stream to finish
                  writer.on('finish', () => {
                      console.log('Downloaded the video successfully.');
                      resolve();
                  });
                  writer.on('error', reject);
              });

          } catch (error) {
              console.error(`Error downloading video: ${error}`);
              reject(error);
          }
      });
  }

  static async upload_to_aws_s3(ad_archive_id, filename) {
      const s3 = new AWS.S3();
      const media_path = path.join(CreativeManager.root_dir, ".data", "content", ad_archive_id, filename);
      const key = `${ad_archive_id}/${filename}`;
      const AWS_BUCKET_NAME = 'efflux-dashboard';
      const CDN_URL = 'https://d267axx109inc5.cloudfront.net/';

      try {
          await s3.upload({
              Bucket: AWS_BUCKET_NAME,
              Key: key,
              Body: fs.createReadStream(media_path)
          }).promise();

          return CDN_URL + key;

      } catch (error) {
          console.error(`Error uploading to S3: ${error}`);
          return false;
      }
  }

  static async download_creatives(creative_url, creative_type, ad_archive_id) {
    const download_path = path.join(CreativeManager.root_dir, ".data", "content", ad_archive_id);
    const filename = ad_archive_id + "_1" + (creative_type === 'video' ? '.mp4' : '.jpg');

    try {
      // Download the file
      if (creative_type === 'video') {
        await CreativeManager.download_video(creative_url, download_path, filename);
      } else if (creative_type === 'image') {
        await CreativeManager.download_image(creative_url, download_path, filename);
      } else {
        throw new Error("Error downloading creative: unknown creative type");
      }

      // Upload to S3
      return await CreativeManager.upload_to_aws_s3(ad_archive_id, filename);

    } catch (error) {
      console.error(`Error processing creative: ${error.message}`);
      return false;
    }
  }

}

module.exports = CreativeManager;
