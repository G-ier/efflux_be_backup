const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class S3Service {
  constructor(bucketName) {
    this.bucketName = bucketName || EnvironmentVariablesManager.getEnvVariable('S3_BUCKET_NAME');
    this.s3Client = new S3Client({
      region: 'us-east-1',
    });
  }

  async generatePresignedUrl(fileName, fileType, expiresIn = 3600, tagging = null) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: fileType,
      Tagging: tagging
    });

    try {
      const result = await getSignedUrl(this.s3Client, command, { expiresIn });
      console.debug('Generated presigned url:', result);
      return result;
    } catch (error) {
      console.error('Error in generating presigned url:', error);
      throw error;
    }
  }
}

module.exports = S3Service;
