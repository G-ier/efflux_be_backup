// Third party imports
const axios = require("axios");

// Local application imports
const { FB_API_URL } = require('../constants');
const { FacebookLogger } = require("../../../shared/lib/WinstonLogger");
const UserAccountRepository = require("../repositories/UserAccountRepository");
const { sendSlackNotification } = require('../../../shared/lib/SlackNotificationService');

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

  async debug(admin_token, access_token, expire_warning_sent = 0, max_expire_warning_sent = 1) {

    const url = `${FB_API_URL}debug_token?access_token=${admin_token}&input_token=${access_token}`;
    let res = null;
    try {
        const response = await axios.get(url);
        res = response.data.data;
    } catch (err) {
        console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
        return ["", false];
    }

    if (res.is_valid) {
      const diffTime = Math.abs(new Date() - new Date(res.expires_at * 1000));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const providerId = res.user_id;
      const account = await this.fetchUserAccounts(["name"], { provider_id: providerId });
      const { name } = account[0];

      if (diffDays < 4) {
        if (this.tokenExpireNotificationSent < this.tokenExpireNotificationMax) {
          await sendSlackNotification(
            `URGENT: Facebook API Token of user ${name} is about to expire in ${diffDays} days, please refresh it.`
          );
          this.tokenExpireNotificationSent++;
        }
      }

      return [name, res.is_valid];
    } else {
      console.log("Token is not valid");
      return ["", false];
    }
  }

  async getFacebookLongToken(accessToken) {
    const { data } =  await axios.get(`${FB_API_URL}oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
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

  async validateAccounts(accounts, admin_token=null) {

    let accountValidity = {};

    // Here we need the TokenService to get the token for each account
    for (const account of accounts) {
      let [username, isValid] = await this.debug(admin_token ? admin_token : account.token, account.token);
      accountValidity[account.id] = isValid;
    }

    // 3 If no accounts are valid, return
    if (Object.values(accountValidity).every((val) => val !== true)) {
      throw new Error("No valid accounts to fetch data from");
    }

    return accounts.filter((account) => accountValidity[account.id] === true);
  }

  async getFetchingAccount() {

    const fetchingFields = ["id", "name", "provider_id", "user_id", "token"];

    // We need to get a admin account and all the other fetching accounts here.
    const adminAccounts = await this.fetchUserAccounts(fetchingFields,
      { provider: "facebook", role: 'admin', fetching: true, backup: false }
    );

    // Attemp to get the admin account/try backup accounts. If none work, throw error.
    let adminAccount;
    try {
      FacebookLogger.info("Retrieving primary admin account and ensuring it is valid")
      const validAccounts = await this.validateAccounts(adminAccounts, null);
      adminAccount = validAccounts[0];
    } catch (err) {

      FacebookLogger.info("Primary account failed, using backup account")

      // We need to get a admin account and all the other fetching accounts here.
      const backupAdminAccounts = await this.fetchUserAccounts(fetchingFields,
        { provider: "facebook", role: 'admin', fetching: true, backup: true }
      );
      try {
        const validAccounts = await this.validateAccounts(backupAdminAccounts, null);
        adminAccount = validAccounts[0];
      } catch (err) {
        FacebookLogger.error("No valid admin accounts found. Terminating")
        throw new Error("No valid admin accounts found");
      }

    }

    const clientAccounts = await this.fetchUserAccounts(fetchingFields,
      { provider: "facebook", role: 'client', fetching: true, backup: false }
    );

    let validClientAccounts = [];
    try {
      FacebookLogger.info("Retrieving client accounts")
      const validAccounts = await this.validateAccounts(clientAccounts, adminAccount.token);
      FacebookLogger.info(`Found ${validAccounts.length} valid client accounts`)
      validClientAccounts = validAccounts;
    } catch {}

    return [adminAccount, ...validClientAccounts];

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
