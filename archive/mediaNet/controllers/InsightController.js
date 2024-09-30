// Local application imports
const { MediaNetLogger }             = require("../../../shared/lib/WinstonLogger");
const InsightService            = require('../services/InsightService');
// const AuthService          = require('../services/AuthService');

class InsightController{
    constructor(){
        this.logger = MediaNetLogger;
        this.insightService = new InsightService();
    }

    async syncInsights(req, res){
        try {
            const { startDate, endDate } = req.query;
            const adsSyncedCount = await this.insightService.syncInsights(startDate, endDate);
            res.status(200).send(`Synced ${adsSyncedCount} MediaNet Ads`);
          } catch (error) {
            res.status(500).send('Error syncing MediaNet Ads');
          }
    }

    async insertInsights(req, res){
      try{
        console.log(req.body);
        await this.insightService.testSync(req.body);
        res.status(200).send(`Synced MediaNet Ads`);
      }
      catch(error){
        console.log(error);
        res.status(500).send('Error syncing MediaNet Ads');

      }
    }
}

module.exports = InsightController