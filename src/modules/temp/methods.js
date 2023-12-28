// Third party imports
const _ = require('lodash');
const assert = require('assert');
const axios = require('axios');
// Local imports
const UserRepository = require('../auth/repositories/UserRepository');
const UserAccountRepository = require('../facebook/repositories/UserAccountRepository');
const AdAccountRepository = require('../facebook/repositories/AdAccountRepository');
const AdsetsRepository = require('../facebook/repositories/AdsetsRepository');
const CampaignRepository = require('../facebook/repositories/CampaignRepository');
const DatabaseConnection = require('../../shared/lib/DatabaseConnection');
const EnvironmentVariablesManager = require('../../shared/services/EnvironmentVariablesManager');
class TemporaryService {
  constructor() {
    this.userRepository = new UserRepository();
    this.adAccountRepository = new AdAccountRepository();
    this.userRepository = new UserRepository();
    this.adsetsRepository = new AdsetsRepository();
    this.campaignRepository = new CampaignRepository();
    this.UserAccountRepository = new UserAccountRepository();
    this.database = new DatabaseConnection().getConnection();
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
      Updating the user id of the ad account will update the user id of the campaigns and adsets.`);
      const updatedCampaignsCount = await this.campaignRepository.update(
        { user_id: updateData.user_id },
        { ad_account_id: filter.id },
      );
      const updatedAdsetsCount = await this.adsetsRepository.update(
        { user_id: updateData.user_id },
        { ad_account_id: filter.id },
      );
      console.log('Campaigns  Updated', updatedCampaignsCount);
      console.log('Adsets     Updated', updatedAdsetsCount);
    }

    console.log('Ad Accounts Updated', updateCount);
    return updateCount !== 0;
  }

  async fetchUsersWithAdAccounts(userId, isAdmin) {
    let userFilters = {};
    if (!isAdmin) userFilters = { id: userId };
    let users = await this.userRepository.fetchUsers(["*"], userFilters);
    const userIds = users.map(user => user.id);

    // Fetch ad_account ids of backup user accounts and exclude them from the ad accounts query.
    const whereClause = { 'ua.backup': false };
    if (!isAdmin) whereClause['ad_accounts.user_id'] = userIds;

    const adAccounts = await this.adAccountRepository.fetchAdAccounts(
      [
        'ad_accounts.id',
        'ad_accounts.provider_id',
        'ad_accounts.user_id',
        'ad_accounts.name',
        'ad_accounts.provider',
      ],
      whereClause,
      1000,
      [
        {
          type: 'inner',
          table: 'user_accounts AS ua',
          first: `ad_accounts.account_id`,
          operator: '=',
          second: 'ua.id',
        },
      ],
    );

    users = users.map((user) => {
      user.ad_accounts = adAccounts.filter((adAccount) => adAccount.user_id === user.id);
      return user;
    });

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
    const response = await this.database('column_presets').insert(body).returning('*');
    return response[0];
  }

  async deleteColumnPreset(presetId) {
    assert(presetId, 'ID is required');
    const response = await this.database('column_presets').where('id', presetId).del();
    return response;
  }

  async getAuth0ManagementApiToken() {
    const url = `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/oauth/token`;
    const payload = {
      client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
      client_secret: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_SECRET'),
      audience: `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/api/v2/`,
      grant_type: 'client_credentials',
      scope: 'create:user_tickets', // Add other required scopes if necessary
    };

    const response = await axios.post(url, payload);
    return response.data.access_token;
  }

  async createPasswordChangeTicket(email) {
    const url = `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/dbconnections/change_password`;

    const body = {
      client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
      email: email,
      connection: 'Username-Password-Authentication',
    };

    // Note that we're not using an Auth0 Management API token here
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async updateUserDetails(userId, name) {
    const auth0Token = await this.getAuth0ManagementApiToken(); // Retrieve your Auth0 Management API token

    const url = `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/api/v2/users/${userId}`;

    const headers = {
      Authorization: `Bearer ${auth0Token}`,
      'Content-Type': 'application/json',
    };

    const body = {};
    if (name) body.name = name;
    const response = await axios.patch(url, body, { headers });

    // If Auth0 update is successful, update the name in your UserRepository
    if (response.status === 200) {
      await this.userRepository.update({ name }, { sub: userId });
    }

    return response.data;
  }

  async fetchUser(id) {
    const user = await this.userRepository.fetchOne(['*'], { id });
    return user;
  }

  async fetchUserOrganization(userId) {
    const organization = await this.userRepository.fetchUserOrganization(userId);
    return organization;
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
      const adAccounts = await this.temporaryService.fetchAdAccountsFromDatabase(
        fields,
        filters,
        limit,
      );
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
      res.status(200).json({
        message: `AdAccount ${id} and it's campaigns + adsets were updated. Updated campaigns count: ${updated}`,
      });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUsersWithAdAccounts(req, res) {
    try {
      const userId = req.user.id;
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
      else filters = { user_id: req.user.id };

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

  async updatePassword(req, res) {
    try {
      const { email } = req.body;

      const ticketUrl = await this.temporaryService.createPasswordChangeTicket(email);
      res
        .status(200)
        .json({ message: 'Password reset email sent successfully', ticketUrl: ticketUrl });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

async updateUserDetails(req, res) {
  try {
    const { name,userId } = req.body;
    const user = userId || req.user.sub; // Ensure that the user's ID is available, typically through authentication middleware

      // Validate the input as necessary
      if (!name) {
        return res.status(400).json({ message: 'No update parameters provided.' });
      }

      // Call a service method to update the user details
      const updateResult = await this.temporaryService.updateUserDetails(user, name);
      console.log({ updateResult });
      // Construct a response message based on what was updated
      let message = 'User details updated successfully: ';
      if (name) message += 'Name ';

      res.status(200).json({ message: message.trim(), updateResult });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  // This will be used to get ad accounts from a user_id. If the user is admin, it will get all ad accounts.
  async fetchUser(req, res) {
    try {
      const { id } = req.params;
      const user = await this.temporaryService.fetchUser(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // This will be used to get the user organization
  async fetchUserOrganization(req, res) {
    try {
      const { userId } = req.params;
      const organization = await this.temporaryService.fetchUserOrganization(userId);
      res.status(200).json(organization);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = TemporaryController;
