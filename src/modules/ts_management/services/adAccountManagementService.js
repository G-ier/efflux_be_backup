// Third party imports
const _ = require('lodash');

// Local imports
const AdAccountManagementRepository = require('../repositories/managementRepository');

class AdAccountManagementService {

  constructor() {

    this.managementRepository = new AdAccountManagementRepository();

  }

  // Use static method to get the connection where needed
  get database() {
    return DatabaseConnection.getReadWriteConnection();
  }

  async excludeAdAccount(ad_account_id, ad_account_provider_id, traffic_source, name, mediaBuyer) {
    const exclusion_event = await this.managementRepository.excludeAdAccount(ad_account_id, ad_account_provider_id, traffic_source, name, mediaBuyer);
    if(exclusion_event.status == 200){
      return {status: 200, results: exclusion_event.queryResult};
    } else {
      return {status: 500};
    }
  }

  async includeExcludedAdAccount(id, adAccountId, mediaBuyer) {
    const inclusion_event = await this.managementRepository.includeExcludedAdAccount(id, adAccountId, mediaBuyer);
    if(inclusion_event.status == 200){
      return {status: 200, results: inclusion_event.queryResult};
    } else {
      return {status: 500};
    }
  }

  async fetchAdAccounts() {
    const fetch_event = await this.managementRepository.fetchAdAccounts();
    if(fetch_event.status == 200){
      return {status: 200, adAccounts: fetch_event.queryResult};
    } else {
      return {status: 500};
    }
  }

  async fetchExcludedAdAccounts() {
    const fetch_event = await this.managementRepository.fetchExcludedAdAccounts();
    if(fetch_event.status == 200){
      return {status: 200, adAccounts: fetch_event.queryResult};
    } else {
      return {status: 500};
    }
  }


}

module.exports = AdAccountManagementService;
