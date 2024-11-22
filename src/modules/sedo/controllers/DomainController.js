const DomainService = require("../services/DomainService");
const { SedoLogger } = require("../../../shared/lib/WinstonLogger");

class DomainController {
    constructor() {
        this.service = new DomainService();
        this.logger = SedoLogger;
    }

    async insertDomainIntoSedo(req, res) {
        try {
            const domainData = req.body;
            if (!domainData || !domainData.domain)
            {
              return res.status(400).json({ error: "domain is required" });
            }

            await this.service.insertDomainIntoSedo([domainData]);
            this.logger.error(`Domain is inserted`);
            res.status(200).send(`Domain is inserted in sedo`);
        } catch (error) {
            this.logger.error(`❌ Error inserting domain: ${error.message}`);
            res.status(500).send(error.message);
        }
    }

}

module.exports = DomainController;