const axios = require("axios");

// Local applications import
const UserAccountRepository = require("../repositories/UserAccountRepository");
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { sendSlackNotification }  = require("../../../shared/lib/SlackNotificationService");
const EnvironmentVariablesManager = require("../../../shared/services/EnvironmentVariablesManager");
const { TABOOLA_URL,
  TABOOLA_CLIENT_ID,
  TABOOLA_CLIENT_SECRET
} = require("../constants");


class UserAccountService extends BaseService {

    // To sync the Taboola account, we need to do the following:
    // 1. Get the access token from the API
    // 2. Get the network account details from the API

    // In Taboola, you have an Ad Account that you can label as a "Network Account".
    // This is the Network Ad Account that can be used to fetch all the other Ad Accounts
    // that are under it. This is the reason why we need to fetch the Network Account first.

    constructor() {
        super(TaboolaLogger);
        this.userAccountRepostiory = new UserAccountRepository();
        this.token = null;
        this.expires_in = null;
    }

    async fetchAccountFromDatabase(fields = ["*"], filters = {}, limit) {
        const accounts = await this.userAccountRepostiory.fetchUserAccounts(fields, filters, limit);
        return accounts;
    }

    async upsertAccountToDB(account) {
      this.logger.info("Upserting account");
      return await this.userAccountRepostiory.upsert([account]);

    }

    async getFetchingAccount() {
      const filters = { provider: "taboola", fetching: true };
      const accounts = await this.userAccountRepostiory.fetchUserAccounts(
        ["id", "name", "provider_id", "user_id", "token"],
        filters
      );
      return accounts[0];
    }

    async getTaboolaAdvertiserTokenFromAuthCode(auth_code) {
      const url = `${TABOOLA_URL}/oauth/token`;
      const headers = {
        "Host": "https://backstage.taboola.com",
        "Content-Type": "application/x-www-form-urlencoded"
      };
      const params = {
        // client_id: [client_id],
        // client_secret: [client_secret],
        code: auth_code,
        // redirect_uri: [redirect_uri],
        // grant_type: authorization_code
      };
      res = this.postToApi(url, params, "Error getting Taboola Access token", headers);

      return res;
    }

    async getTaboolaAdvertiserTokenFromClient() {

      this.logger.info("Fetching access token from API");

      const url = `${TABOOLA_URL}/oauth/token`;
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const queryParams = new URLSearchParams({
        client_id: TABOOLA_CLIENT_ID,
        client_secret: TABOOLA_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }).toString();

      const finalURL = `${url}?${queryParams}`;

      const res = await this.postToApi(finalURL, {}, "Error getting Taboola Access token", headers);

      console.log("Taboola Token Fetching Response", res);

      this.logger.info("DONE Fetching access token from API");
      return res;
    }

    async getAccessToken() {
      if (!this.token || !this.expires_in) {
        // 1. Try to fetch the token from the database
        // 2. Check if the token is still valid
        // 3. If the token is not valid, fetch a new token from the API
      }
      return this.token;
    }

    async syncTaboolaNetworkAccount(access_token) {

      // The function that sync Taboola Network Accounts (parent entity of advertiser accounts)

      this.logger.info("Fetching network account details from API");
      const url = `${TABOOLA_URL}/api/1.0/users/current/account`;
      const header = {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
      const res = await this.fetchFromApi(url, {}, "Error getting Taboola Network Account", header);

      console.log("Taboola User Accounts Fetching Response", res);

      const mappedRes = {
        name: res.name,
        provider: 'taboola',
        provider_id: res.account_id,
        status: res.is_active ===true ? 'active': '',
        token: access_token,
        user_id: 3,
        fetching: 't',
        backup: 'false',
        role: 'admin',
      }
      await this.upsertAccountToDB(mappedRes);
      this.logger.info("Successfully synced network account details from API");
      return mappedRes;
    }
}

module.exports = UserAccountService;
