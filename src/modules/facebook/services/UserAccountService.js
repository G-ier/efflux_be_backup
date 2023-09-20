// Third party imports
const axios = require("axios");

// Local application imports
const { FB_API_URL, FETCHING_ACCOUNTS_IDS } = require('../constants');
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

  async getFetchingAccount() {

    const accounts = await this.fetchUserAccounts(["id", "provider_id", "user_id", "token"], { provider: "facebook", id: FETCHING_ACCOUNTS_IDS });
    let accountValidity = {};

    // Here we need the TokenService to get the token for each account
    for (const account of accounts) {
      let [username, isValid] = await this.debug(account.token, account.token);
      accountValidity[account.id] = isValid;
    }

    // 3 If no accounts are valid, return
    if (Object.values(accountValidity).every((val) => val !== true)) {
      throw new Error("No valid accounts to fetch data from");
    }

    return accounts.filter((account) => accountValidity[account.id] === true)[0];
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
