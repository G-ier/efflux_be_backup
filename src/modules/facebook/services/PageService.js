// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const PageRepository = require("../repositories/PageRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL, delay } = require('../constants');

class PageService extends BaseService{
    constructor(){
        super(FacebookLogger);
        this.pageRepository = new PageRepository();
    }

    async getPagesFromAPI(access_token, businessIds){
        this.logger.info(`Fetching Pages from API`);
        // const fields = "id, name";
        const results = { sucess: [], error: [] };
        const allPages = await async.mapLimit(businessIds, 100, async (businessId) => {
            let paging = {};
            const pages = [];
            let url = `${FB_API_URL}${businessId}/owned_pages`;
            let params = {
                access_token,
            };
            do {
              if (paging?.next) {
                url = paging.next;
                params = {};
              }
      
              const { data = [] } = await axios
                .get(url, {
                  params,
                })
                .catch((err) => {
                  results.error.push(businessId);
                  return {};
                });
      
              results.sucess.push(businessId);
              paging = { ...data?.paging };
              if (data?.data?.length) pages.push(...data?.data);
              await delay(1000);
            } while (paging?.next);
      
            return pages;
        });
        if (results.sucess.length === 0) throw new Error("All businesses failed to fetch pages");
        this.logger.info(
          `Business Pages Fetching Telemetry: SUCCESS(${results.sucess.length}) | ERROR(${results.error.length})`,
        );
        
        return _.flatten(allPages);
    }

    async syncPages(access_token, businessIds){
        const pages = await this.getPagesFromAPI(access_token, businessIds);
        this.logger.info(`Upserting ${pages.length} pages`);
        await this.executeWithLogging(
          () => this.pageRepository.upsert(pages),
          "Error upserting pages"
        )
        this.logger.info(`Done upserting pages`);
        return pages
    }

    async fetchPagesFromDB(fields = ['*'], filters = {}, limit){
        const results = await this.pageRepository.fetchPages(fields, filters, limit);
        return results;
    }
}

module.exports = PageService;