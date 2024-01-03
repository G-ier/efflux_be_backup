// Local applications import
const UserAccountRepository = require("../repositories/UserAccountRepository");
const { TaboolaLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
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

    async getFetchingAccount() {
      const filters = { provider: "taboola", fetching: true };
      const accounts = await this.userAccountRepostiory.fetchUserAccounts(
        ["id", "name", "provider_id", "user_id", "token"],
        filters
      );
      return accounts[0];
    }

    /**
     * Unused, gets refresh token through a sign in popup. Getting it from client removes this step for users.
    */
    // async getTaboolaAdvertiserTokenFromAuthCode(auth_code) {
    //   const url = `${TABOOLA_URL}/oauth/token`;
    //   const headers = {
    //     "Host": "https://backstage.taboola.com",
    //     "Content-Type": "application/x-www-form-urlencoded"
    //   };
    //   const params = {
    //     // client_id: [client_id],
    //     // client_secret: [client_secret],
    //     code: auth_code,
    //     // redirect_uri: [redirect_uri],
    //     // grant_type: authorization_code
    //   };
    //   res = this.postToApi(url, params, "Error getting Taboola Access token", headers);

    //   return res;
    // }

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
      this.logger.info("DONE Fetching access token from API");
      return res;
    }

    async syncTaboolaNetworkAccount(access_token, expires_in) {

      // The function that sync Taboola Network Accounts (parent entity of advertiser accounts)

      this.logger.info("Fetching network account details from API");
      const url = `${TABOOLA_URL}/api/1.0/users/current/account`;
      const header = {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
      const res = await this.fetchFromApi(url, {}, "Error getting Taboola Network Account", header);

      const currentTimeInMilliseconds = new Date().getTime();
      // Calculate the expiration time in milliseconds
      const expirationTimeInMilliseconds = currentTimeInMilliseconds + expires_in * 1000;
      // Create a Date object for the expiration time
      const expirationDate = new Date(expirationTimeInMilliseconds);

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
        expires_in: expirationDate
      }

      await this.userAccountRepostiory.upsert([mappedRes]);
      this.logger.info("Successfully synced network account details from API");
      return mappedRes;
    }

    async getAccessToken() {

      this.logger.info("Checking if token is still valid.");
      if (!this.token || this.expires_in < new Date()) {
        const { access_token, expires_in } = await this.getTaboolaAdvertiserTokenFromClient();
        const res = await this.syncTaboolaNetworkAccount(access_token, expires_in);
        this.token = res.token;
        this.expires_in = res.expires_in;
      }
      else{
        this.logger.info("Using available stored token");
      }
      return this.token;
    }
}

module.exports = UserAccountService;
