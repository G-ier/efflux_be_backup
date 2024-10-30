const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class AdAccountManagementRepository {

  constructor(database) {
    this.tableName = "network_campaigns";
    this.userAssociationTableName = "network_campaigns_user_relations";
    this.database = database || new DatabaseRepository();
  }

  async excludeAdAccount(ad_account_id, ad_account_provider_id, traffic_source, name){
    try {
      const queryResult = await this.database.insert("excluded_ad_accounts", {ad_account_id, ad_account_provider_id, traffic_source, name});
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }
  }

  async includeExcludedAdAccount(id, adAccountId){
    try {
      const queryResult = await this.database.delete("excluded_ad_accounts", {ad_account_id: adAccountId});
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }
  }

  async fetchAdAccounts(){
    const queryResult = await this.database.query("ad_accounts");
    if(queryResult != null && queryResult.length != 0){
      return {status: 200, queryResult};
    }
    else {
      return {status: 500};
    }
  }

  async fetchExcludedAdAccounts(){

    try {
      const queryResult = await this.database.query("excluded_ad_accounts");
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }

  }


}

module.exports = AdAccountManagementRepository;
