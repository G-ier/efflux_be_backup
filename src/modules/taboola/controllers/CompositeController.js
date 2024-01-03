const CompositeService = require("../services/CompositeService");

class CompositeController {
    constructor(){
        this.compositeService = new CompositeService();
    }

    async updateTaboolaData(req, res){
        const { startDate, endDate } = req.query;

        const updateResult = await this.compositeService.syncUserAccountsData(startDate, endDate);

        if (updateResult) res.status(200).send("Taboola data updated");
        else res.status(500).send("The server failed to update taboola data");

    }

    async CapiTest(req, res){
        const { date } = req.query;

        await this.compositeService.sendS2SEvents(date);
    }
}

module.exports = CompositeController;
