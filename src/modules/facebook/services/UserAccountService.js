// Third party imports
const axios = require("axios");

// Local application imports
const { FB_API_URL } = require('../constants');
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const UserAccountRepository = require("../repositories/UserAccountRepository");
const { sendSlackNotification } = require('../../../shared/lib/SlackNotificationService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class UserAccountService {

  constructor () {
    this.userAccountRepository = new UserAccountRepository();
    this.tokenExpireNotificationSent = 0;
    this.tokenExpireNotificationMax = 1;
  }

  async fetchUserAccounts(fields = ['*'], filters = {}, limit) {
    const userAccounts = await this.userAccountRepository.fetchUserAccounts(fields, filters, limit);
    return userAccounts;
  }

  async fetchUserAccountById(id, fields = ['*']) {
    const userAccount = await this.userAccountRepository.fetchUserAccounts(fields, { id: id });
    return userAccount;
  }

  async getFacebookLongToken(accessToken) {
    const { data } =  await axios.get(`${FB_API_URL}oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: EnvironmentVariablesManager.getEnvVariable('FACEBOOK_APP_ID'),
        client_secret: EnvironmentVariablesManager.getEnvVariable('FACEBOOK_APP_SECRET'),
        fb_exchange_token: accessToken,
      }
    }).catch(err => {
      console.error("Error fetching facebook long token", err);
    });
    return data.access_token;
  }

  async revokeFacebookToken(access_token, providerId) {
    try {
      await axios.delete(`${FB_API_URL}${providerId}/permissions`, {
        params: {
          access_token: access_token,
        }
      })
      return true;
    } catch (err) {
      // ADD LOGGER
      console.error('Error revoking facebook token', err);
      return false;
    }
  }

  async debug(accountName, token) {

    const url = `${FB_API_URL}oauth/access_token_info?access_token=${token}`;
    let res;
    try {
        const response = await axios.get(url);
        res = response.data;
    } catch (err) {
        console.log(`Token of user ${accountName} is invalid`)
        return false
    }

    // Notify in Slack if token is about to expire in 4 days.
    // Expires is is in seconds.
    if (res.expires_in) {
      const diffDays = Math.ceil(res.expires_in / (60 * 60 * 24));
      if (diffDays < 4) {
        if (this.tokenExpireNotificationSent < this.tokenExpireNotificationMax) {
          await sendSlackNotification(
            `URGENT: Facebook API Token of user ${accountName} is about to expire in ${diffDays} days, please refresh it.`
          );
          this.tokenExpireNotificationSent++;
        }
      }
    }
    return true
  }

  async validateFacebookAccountToken(accounts) {
    const brokenAccountIds = []; const validAccounts = [];
    for (const account of accounts) {
      const isValid = await this.debug(account.name, account.token);
      if (isValid) validAccounts.push(account);
      else brokenAccountIds.push(account.id);
    }
    return [brokenAccountIds, validAccounts];
  }

  async getFetchingAccount(admins_only = false, clients_only = false, specificId = null) {

    const fetchingFields = ["id", "name", "provider_id", "user_id", "token", "role", "business_id"];

    // We need to get a admin account and all the other fetching accounts here.
    const whereClause = { provider: "facebook", fetching: true };
    if (specificId) whereClause.id = specificId;
    const accounts = await this.fetchUserAccounts(fetchingFields,
      whereClause
    );

    FacebookLogger.info(`Found ${accounts.length} accounts to fetch data from`);

    // Segregate the accounts into valid and broken accounts
    const [brokenAccountIds, validAccounts] = await this.validateFacebookAccountToken(accounts);

    // Mark broken accounts as not fetching
    if (brokenAccountIds.length > 0) {
      const updateCount = await this.userAccountRepository.update({ fetching: false }, { id: brokenAccountIds });
      FacebookLogger.info(`Marked ${updateCount} broken accounts as not fetching`);
    }
    // If no accounts are valid, return
    if (validAccounts.length === 0) {
      throw new Error("No valid accounts to fetch data from");
    }
    return validAccounts;
  }

  async saveUserAccountToDB(accountDetails) {
    return await this.userAccountRepository.saveOne(accountDetails);
  }

  async updateUserAccount(data, criteria) {
    return await this.userAccountRepository.update(data, criteria);
  }

  async deleteUserAccount(criteria) {
    return await this.userAccountRepository.delete(criteria);
  }

}

module.exports = UserAccountService;
