// Third party imports
const axios = require("axios");
const async = require("async");
const _ = require("lodash");

// Local application imports
const PageRepository = require("../repositories/PageRepository");
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { FB_API_URL, delay } = require('../constants');

class PageService extends BaseService {

    constructor(){
        super(FacebookLogger);
        this.pageRepository = new PageRepository();
    }

    async getPagesFromAPI(accounts, isBusiness) {

      const pageType = isBusiness ? 'business' : 'user';
      this.logger.info(`Fetching ${pageType} owned pages for ${accounts.length} ${pageType === 'business' ? 'businesses' : 'user accounts'}`);

      const allPages = await async.mapLimit(accounts, 100, async (account) => {
        const { id: account_id, name: facebook_profile_name, provider_id: facebook_user_id, user_id: efflux_user_id, token: access_token } = account;
        this.logger.info(`Using account ${facebook_profile_name} to fetch pages for ${pageType}: ${isBusiness ? account.business_id : facebook_profile_name}`);

        let paging = {};
        const pages = [];
        let url = isBusiness ? `${FB_API_URL}${account.business_id}/owned_pages` : `${FB_API_URL}me/accounts`;
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
            .catch(({ response : { data } }) => {
              this.logger.error(`Error fetching pages for account ${facebook_profile_name}: ${data.error.message}`);
              return {};
            });

          paging = { ...data?.paging };

          if (data?.data?.length) {
            for (const page of data?.data) {
              page.account_id = account_id;
              page.facebook_user_id = facebook_user_id;
              page.efflux_user_id = efflux_user_id;
            }
            pages.push(...data?.data);
          }

          await delay(1000);
        } while (paging?.next);

        this.logger.info(`Fetched ${pages.length} pages with ${facebook_profile_name} for ${pageType}: ${isBusiness ? account.business_id : facebook_profile_name}`);
        return pages;
      });
      const flattenedPages = _.flatten(allPages);
      this.logger.info(`Fetched ${flattenedPages.length} pages for ${accounts.length} ${pageType === 'business' ? 'businesses' : 'accounts'}`);
      return flattenedPages;
    }

    async syncPages(accounts, isBusiness) {

      const pages = await this.getPagesFromAPI(accounts, isBusiness);
      this.logger.info(`Upserting ${pages.length} ${isBusiness ? 'business' : 'user'} pages`);
      await this.executeWithLogging(
        () => this.pageRepository.upsert(pages),
        "Error upserting pages"
      );
      this.logger.info(`Done upserting pages`);

      return pages;
    }

    async fetchPageById(pageId) {
      const results = await this.pageRepository.fetchPages(['*'], { id: pageId });
      return results;
    }

    async fetchPagesFromDB(fields = ['*'], filters = {}, limit){
        const results = await this.pageRepository.fetchPages(fields, filters, limit);
        return results;
    }

}

module.exports = PageService;
