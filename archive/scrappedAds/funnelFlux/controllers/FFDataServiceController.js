// Local application imports
const FFDataService = require('../services/FFDataService');

class FFDataServiceController {

  constructor() {
    this.ffDataService = new FFDataService();
  }

  async generateAdsetHourlyReport(req, res) {
    let { startDate, endDate, includeDateMatchingIdentifier} = req.query;
    startDate = startDate.split(" ").join("+")
    endDate = endDate.split(" ").join("+")
    const hourlyReport = await this.ffDataService.getAdsetHourlyReport( startDate, endDate, includeDateMatchingIdentifier === "true" );
    res.json(hourlyReport);
  }

}

module.exports = FFDataServiceController;
