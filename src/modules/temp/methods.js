// Third party imports
const _                         = require('lodash');
const assert                    = require('assert');

// Local imports
const UserRepository            = require('../auth/repositories/UserRepository');
const UserAccountRepository     = require('../facebook/repositories/UserAccountRepository');
const AdAccountRepository       = require('../facebook/repositories/AdAccountRepository');
const AdsetsRepository          = require('../facebook/repositories/AdsetsRepository');
const CampaignRepository        = require('../facebook/repositories/CampaignRepository');
const DatabaseConnection        = require('../../shared/lib/DatabaseConnection');

class TemporaryService {

  constructor() {
    this.userRepository         = new UserRepository();
    this.adAccountRepository    = new AdAccountRepository();
    this.userRepository         = new UserRepository();
    this.adsetsRepository       = new AdsetsRepository();
    this.campaignRepository     = new CampaignRepository();
    this.UserAccountRepository  = new UserAccountRepository();
    this.database               = new DatabaseConnection().getConnection();
  }

  // This will be used to get ad accounts from a user_id. If the user is admin, it will get all ad accounts.
  async fetchAdAccountsFromDatabase(fields = ['*'], filters = {}, limit) {
    if (filters.user_id && filters.user_id === 'admin') {
      delete filters.user_id;
    }
    const results = await this.adAccountRepository.fetchAdAccounts(fields, filters, limit);
    return results;
  }

  async updateAdAccount(filter, updateData) {

    const updateCount = await this.adAccountRepository.update(updateData, filter);

    if (updateData.user_id) {
      console.log(`
      Campaigns and adsets have a user id which is linked to ad account id.
      Updating the user id of the ad account will update the user id of the campaigns and adsets.`
      )
      const updatedCampaignsCount = await this.campaignRepository.update({user_id: updateData.user_id}, {ad_account_id: filter.id});
      const updatedAdsetsCount = await this.adsetsRepository.update({user_id: updateData.user_id}, {ad_account_id: filter.id});
      console.log("Campaigns  Updated", updatedCampaignsCount)
      console.log("Adsets     Updated", updatedAdsetsCount)
    }

    console.log('Ad Accounts Updated', updateCount);
    return updateCount !== 0;
  }

  async fetchUsersWithAdAccounts(userId, isAdmin) {

    let userFilters   = {};
    if (!isAdmin) userFilters = { id: userId };
    let users = await this.userRepository.fetchUsers(['id', 'name', 'nickname'], userFilters);
    const userIds = users.map(user => user.id);

    let adAccountFilters = {};
    if (!isAdmin) adAccountFilters = { user_id: userIds };
    const adAccounts = await this.adAccountRepository.fetchAdAccounts(['id', 'user_id', 'name', 'provider'], adAccountFilters, 1000);

    users = users.map(user => {
      user.ad_accounts = adAccounts.filter(adAccount => adAccount.user_id === user.id);
      return user;
    })

    return users;
  }

  async fetchUserAccounts(fields, filters, limit) {
    const userAccounts = await this.UserAccountRepository.fetchUserAccounts(fields, filters, limit);
    return userAccounts;
  }

  async getColumnPresets(user_id) {
    const presets = await this.database('column_presets').where('user_id', user_id);
    return presets;
  }

  async createColumnPreset(body) {
    assert(body.name, 'Name is required');
    assert(body.presets, 'Presets are required');
    assert(body.user_id, 'User ID is required');
    const response = await this.database('column_presets').insert(body).returning('*')
    return response[0];
  }

  async deleteColumnPreset(presetId) {
    assert(presetId, 'ID is required')
    const response = await this.database('column_presets').where('id', presetId).del();
    return response;
  }

}

class TemporaryController {

  constructor() {
    this.temporaryService = new TemporaryService();
  }

  async fetchAdAccountsFromDatabase(req, res) {
    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = JSON.parse(fields);
      if (filters) filters = JSON.parse(filters);
      const adAccounts = await this.temporaryService.fetchAdAccountsFromDatabase(fields, filters, limit);
      res.status(200).json(adAccounts);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updateAdAccount(req, res) {
    try {
      const { id, updateData } = req.body;
      const filter = { id };
      const updated = await this.temporaryService.updateAdAccount(filter, updateData);
      res.status(200).json({ message: `AdAccount ${id} and it's campaigns + adsets were updated. Updated campaigns count: ${updated}` });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUsersWithAdAccounts(req, res) {
    try {
      const userId  = req.user.id;
      const isAdmin = req.user.permissions.includes('admin');
      const users = await this.temporaryService.fetchUsersWithAdAccounts(userId, isAdmin);
      res.status(200).json(users);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUserAccounts(req, res) {

    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = JSON.parse(fields);
      if (filters) filters = JSON.parse(filters);

      if (fields) filters.user_id = req.user.id;
      else filters = { user_id: req.user.id }

      const userAccounts = await this.temporaryService.fetchUserAccounts(fields, filters, limit);
      res.status(200).json(userAccounts);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getColumnPresets(req, res) {
    try {
      const { user_id } = req.query;
      const presets = await this.temporaryService.getColumnPresets(user_id);
      res.status(200).json(presets);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async createColumnPreset(req, res) {
    try {
      const response = await this.temporaryService.createColumnPreset(req.body);
      res.status(200).json(response);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async deleteColumnPreset(req, res) {
    try {
      const { id } = req.query;
      const response = await this.temporaryService.deleteColumnPreset(id);
      res.status(200).json(response);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

}

module.exports = TemporaryController;
