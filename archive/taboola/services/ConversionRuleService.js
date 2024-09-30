const axios = require("axios");
const async = require("async");
_ = require("lodash");

// Local application imports
const ConversionRuleRepository = require("../repositories/ConversionRuleRepository");
const { TABOOLA_URL } = require("../constants");
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { forEach } = require("lodash");
const { error } = require("winston");


class ConversionRuleService extends BaseService {
    constructor() {
        super(TaboolaLogger);
        this.conversionRuleRepository = new ConversionRuleRepository();
    }

    async getConversionRulesFromApi(account_ids, access_token){

        this.logger.info(`Fetching Conversion Rules from API`);
        const results = { sucess: [], error: [] };
        const headers = {
            'Authorization': `Bearer ${access_token}`, 
            'Content-Type': 'application/json',
        }
        const allRules = await async.mapLimit(account_ids, 100, async (account_id) => {
            const rules = [];
            let url = `${TABOOLA_URL}/api/1.0/${account_id}/universal_pixel/conversion_rule`;
            const { data = [] } = await axios
            .get(url, { headers } )
            .catch((err) => {
              console.log(err);
              results.error.push(account_id);
              return {};
            });
            results.sucess.push(account_id);
            if (data?.results?.length) rules.push(...data.results);
    
            return rules;
          });
          if (results.sucess.length === 0) throw new Error("All ad accounts failed to fetch campaigns");
          this.logger.info(
            `Conversion Rules Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
          );
        return _.flatten(allRules);

        // const data = await this.fetchFromApi(url, {}, "Error fetching conversion rule", header);

        // if (data.results.total === 0) throw new Error("Error getting ad accounts");
        // this.logger.info(`Fetched ${data.results.total} Conversion Rules from API`)

        // return data.results;
    }

    async syncConversionRules(account_id, token){
        const conversionRules = await this.getConversionRulesFromApi(account_id, token);
        this.logger.info(`Upserting ${conversionRules.length} Conversion Rules`);

        // const results = await this.executeWithLogging(
        //     () => this.conversionRuleRepository.upsert(conversionRules),
        //     "Error Upserting Conversion Rules"
        //   )
        //   this.logger.info(`Done upserting Conversion Rules`);
        return conversionRules
    }
}

module.exports = ConversionRuleService;