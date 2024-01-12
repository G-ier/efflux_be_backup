// Local application imports
const AdService = require('../services/AdService');

class AdAccountController {

  constructor() {
    this.adService = new AdService();
  }

  async getAdsOfAdset(req,res){
    const adset_id = req.body.adset_id;
    const ads = await this.adService.getAdsOfAdset(adset_id);
    res.json(ads)
  }

  async getDetailsOfAd(req,res){
    const ad_id = req.body.ad_id;
    const ads = await this.adService.getDetailsOfAd(ad_id);
    res.json(ads)
  }

}

module.exports = AdAccountController;
