const {
  AVAILABLE_NETWORKS,
  AVAILABLE_TRAFFIC_SOURCES
} = require('../constants');
const RevealBotSheetService = require('../services/RevealBotSheetService');

class RevealBotSheetController {

  constructor () {
    this.revealBotSheetService = new RevealBotSheetService();
  }

  async refreshSheet(req, res) {

    const {traffic_source, network} = req.query;

    if (!AVAILABLE_NETWORKS.includes(network)) {
      return res.status(400).json({error: `Network ${network} is not supported`});
    }
    if (!AVAILABLE_TRAFFIC_SOURCES.includes(traffic_source)) {
      return res.status(400).json({error: `Traffic source ${traffic_source} is not supported`});
    }

    if (traffic_source === 'facebook')
      await this.revealBotSheetService.updateFacebookRevealBotSheets(network);
    if (traffic_source === 'tiktok')
      await this.revealBotSheetService.updateTiktokRevealBotSheets(network);

    return res.json({message: `Revealbot sheet for ${network} ${traffic_source} is being updated`});

  };

}

module.exports = RevealBotSheetController;
