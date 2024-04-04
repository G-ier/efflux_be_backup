const S3Service = require('../../../shared/lib/S3Service');
const AdLauncherService = require('../service/AdLauncherService');
const RedirectUrlsService = require('../service/RedirectUrlsService');

class AdLauncherController {

  constructor() {
    this.s3Service = new S3Service();
    this.redirectUrlsService = new RedirectUrlsService();
    this.adLauncherService = new AdLauncherService();
  }

  async generatePresignedUrl(req, res) {
    console.debug('Generating presigned url...');
    const { filename, type, ad_account, tags, extension } = req.body;

    const org_id = req.user.org_id || 1;
    const internal_campaign_id = tags.internal_campaign_id || null;
    const filepath = this.generatePath(org_id, ad_account, filename, type, internal_campaign_id, extension);

    let taggingString = null;
    if (tags !== null) {
      // Convert tagging object to a URL-encoded string
      const tag = Object.entries(tags).map(([key, value]) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });
      taggingString = tag.join('&');
    }

    try {
      const url = await this.s3Service.generatePresignedUrl(filepath, type, 3600, taggingString);
      return res.json({ url });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  generatePath(org_id, ad_account, filename, type, internal_campaign_id, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`; // Combines them in the "YYYY-MM-DD" format
    let mediType = 'unknown';
    if (type.includes('video')) {
      mediType = 'videos';
    }
    if (type.includes('image')) {
      mediType = 'images';
    }
    return `raw/${org_id}/${ad_account}/${mediType}/${formattedDate}/${filename}-${internal_campaign_id}.${extension}`;
  }

  async getRedirectUrls(req, res) {
    const { campaignId, network } = req.query;
    const urls = await this.redirectUrlsService.getRedirectUrls(campaignId, network);
    return res.json({
      urls,
    });
  }

  async getDomain(req, res) {
    const domains = await this.redirectUrlsService.getSedoDomain();
    return res.json({
      domains,
    });
  }

  async getTonicCampaigns(req, res) {
    const campaigns = await this.adLauncherService.getTonicCampaigns();
    return res.json({
      campaigns,
    });
  }
}

module.exports = AdLauncherController;
