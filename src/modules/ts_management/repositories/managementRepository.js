const _ = require("lodash");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");
const excludeAdAccountQuery = require("../queries/excludeAdAccountQuery");
const fetchAdAccountsQuery = require("../queries/fetchAdAccountsQuery");
const includeExcludedAdAccountsQuery = require("../queries/includeExcludedAdAccountsQuery");
const fetchExcludedAdAccountsQuery = require("../queries/fetchExcludedAdAccountsQuery");

class AdAccountManagementRepository {

  constructor(database) {
    this.tableName = "network_campaigns";
    this.userAssociationTableName = "network_campaigns_user_relations";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(campaign) {
    const dbObject = this.toDatabaseDTO(campaign);
    return await this.database.insert(this.tableName, dbObject);
  }

  async saveInBulk(campaigns, chunkSize = 500) {
    let data = campaigns.map((campaign) => this.toDatabaseDTO(campaign));
    let dataChunks = _.chunk(data, chunkSize);
    for (let chunk of dataChunks) {
      await this.database.insert(this.tableName, chunk);
    }
  }

  async update(data, criteria) {
    return await this.database.update(this.tableName, data, criteria);
  }

  async delete(criteria) {
    return await this.database.delete(this.tableName, criteria);
  }

  async upsert(campaigns, chunkSize = 500) {
    const dbObjects = campaigns.map((campaign) => this.toDatabaseDTO(campaign));
    const dataChunks = _.chunk(dbObjects, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tableName, chunk, "id");
    }
  }

  async upsertUserAssociation(network, networkCampaignId, userId) {

    const relation = {
      network,
      network_campaign_id: networkCampaignId,
      user_id: userId,
      source: 'manual' // is set to manual by default here.
    }

    await this.database.upsert(this.userAssociationTableName, [relation], "user_id, network_campaign_id, network");

    return relation;
  }

  async excludeAdAccount(ad_account_id, ad_account_provider_id, traffic_source, name, mediaBuyer){
    try {
      const queryResult = await excludeAdAccountQuery(this.database, ad_account_id, ad_account_provider_id, traffic_source, name, mediaBuyer);
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }
  }

  async includeExcludedAdAccount(id, adAccountId, mediaBuyer){
    try {
      const queryResult = await includeExcludedAdAccountsQuery(this.database, id, adAccountId, mediaBuyer);
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }
  }

  async fetchAdAccounts(){
    const queryResult = await fetchAdAccountsQuery(this.database);
    if(queryResult != null && queryResult.length != 0){
      return {status: 200, queryResult};
    }
    else {
      return {status: 500};
    }
  }

  async fetchExcludedAdAccounts(){

    try {
      const queryResult = await fetchExcludedAdAccountsQuery(this.database);
      return {status: 200, queryResult};
    } catch (error) {
      return {status: 500};
    }

  }


}

module.exports = AdAccountManagementRepository;
