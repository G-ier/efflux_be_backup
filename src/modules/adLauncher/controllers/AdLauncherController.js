const S3Service = require('../../../shared/lib/S3Service');

class AdLancherController {
  constructor() {
    this.s3Service = new S3Service();
  }

  async generatePresignedUrl(req, res) {
    console.debug('Generating presigned url...');
    const { filename, type } = req.body;
    console.debug('Request body:', req.body);
    try {
      const url = await this.s3Service.generatePresignedUrl(filename, type);
      console.debug('Generated presigned url:', url);
      return res.json({ url });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AdLancherController;
