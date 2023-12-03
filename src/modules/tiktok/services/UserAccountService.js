const axios = require("axios");

// Local applications import
const { TIKTOK_APP_ID, TIKTOK_APP_SECRET, TIKTOK_API_URL } = require("../constants");
const UserAccountRepository = require("../repositories/UserAccountRepository");
const { tomorrowYMD } = require("../../../shared/helpers/calendar");
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { sendSlackNotification }  = require("../../../shared/lib/SlackNotificationService");
const EnvironmentVariablesManager = require("../../../shared/services/EnvironmentVariablesManager");
const redirectURL = EnvironmentVariablesManager.getEnvVariable("TIKTOK_USER_AUTHENTICATION_REDIRECT_URL")

class UserAccountService extends BaseService{

  constructor() {
    super(TiktokLogger);
    this.userAccountRepostiory = new UserAccountRepository();
  }

  async fetchAccountFromDatabase(fields = ["*"], filters = {}, limit) {
    const accounts = await this.userAccountRepostiory.fetchUserAccounts(fields, filters, limit);
    return accounts;
  }

  async upsertAccountToDB(account) {
    return await this.userAccountRepostiory.upsert([account]);
  }

  async getFetchingAccounts() {
    const filters = { provider: "tiktok", fetching: true };
    const accounts = await this.userAccountRepostiory.fetchUserAccounts(
      ["id", "name", "provider_id", "user_id", "token"],
      filters
    );
    return accounts;
  }

  async getUserAccounts() {

    // Get all fetching accounts
    const filters = { provider: "tiktok", fetching: true };
    const userAccounts = await this.userAccountRepostiory.fetchUserAccounts(
      ["id", "name", "provider_id", "user_id", "token", "expires_in", "refresh_token", "expires_in", "refresh_token_expires_in"],
      filters
    );
    if (userAccounts.length === 0) throw new Error("No fetching accounts found for tik-tok")

    const accounts = [];

    // Check if the access token is expired for any of the account & refresh it if needed
    for (const account of userAccounts) {

      // Check if the refresh token is expired
      if (account.refresh_token_expires_in < tomorrowYMD()) {
        this.logger.info(`Refresh token for account ${account.name} has expired. Notifying the team on slack`);
        sendSlackNotification(`Refresh token for account ${account.name} has expired. Please re-authenticate the account.`);
        return false;
      }

      // Check if the access token is expired
      if (account.expires_in < tomorrowYMD()) {
        this.logger.info(`Access Token for account ${account.name} has expired. Refreshing...`)
        const account = await this.refreshUserAccessTokens(account);
        accounts.push(account);
      }
      else {
        accounts.push(account);
      }
    }
    return accounts;
  }

  async getTikTokAdvertiserToken(auth_code) {
    const url = `${TIKTOK_API_URL}/oauth2/access_token/`;
    const params = {
      app_id: TIKTOK_APP_ID,
      secret: TIKTOK_APP_SECRET,
      auth_code: auth_code
    };
    const headers = {
      "Content-Type": "application/json",
    };

    const res = await this.postToApi(url, params, "Error getting Tiktok access Token", headers);
    return res;
  }

  async getTikTokUserToken(auth_code) {

    const url = `${TIKTOK_API_URL}/tt_user/oauth2/token/`;
    const params = {
      client_id: TIKTOK_APP_ID,
      client_secret: TIKTOK_APP_SECRET,
      grant_type: "authorization_code",
      auth_code: auth_code,
      redirect_uri: redirectURL,
    };
    const headers = {
      "Content-Type": "application/json",
    };

    const res = await this.postToApi(url, params, "Error getting Tiktok access Token", headers);
    return res.data;
  }

  async getUserInfo(token) {
    const url = `${TIKTOK_API_URL}/user/info/`
    const res = await this.fetchFromApi(url, {}, "Error getting user info from TikTok API", { 'Access-Token': token });
    return res;
  }

  async getProfileData(token, open_id) {

    const url = `${TIKTOK_API_URL}/business/get/`
    const params = {
      business_id: open_id,
      fields: '["username"]'
    }

    const res = await this.fetchFromApi(url, params, "Error getting profile data from TikTok API", { 'Access-Token': token });
    return res;
  }

  async refreshUserAccessTokens(account) {

    // Receive the renewed token values
    const renewedToken = await this.getRenewedAccessToken(account.refresh_token);

    const expires_in_ts = new Date(new Date().getTime()  + (renewedToken.expires_in * 1000))
    const refresh_token_expires_in_ts = new Date(new Date().getTime() + (renewedToken.refresh_token_expires_in * 1000))

    // Update expired account data
    account.token = renewedToken.access_token;
    account.expires_in = expires_in_ts;
    account.refresh_token = renewedToken.refresh_token;
    account.refresh_token_expires_in = refresh_token_expires_in_ts;

    //Update the database
    await this.upsertAccountToDB(account);

    this.logger.info(`Successfully updated ${accounts.length} access tokens.`)
    return account;
  }

  async getRenewedAccessToken(refresh_token) {
    const url = `${TIKTOK_API_URL}/tt_user/oauth2/refresh_token/`;
    const params = {
      client_id: TIKTOK_APP_ID,
      client_secret: TIKTOK_APP_SECRET,
      grant_type: "refresh_token",
      refresh_token: refresh_token
    };
    const headers = {
      "Content-Type": "application/json",
    };

    let res = await this.postToApi(url, params, "Error renewing Access Token", headers);
    return res.data;
  }

  async revokeAdvertiserAccessToken(token) {
    const url = `${TIKTOK_API_URL}/oauth2/revoke_token/`;
    const params = {
      app_id: TIKTOK_APP_ID,
      secret: TIKTOK_APP_SECRET,
      access_token: token
    };
    const headers = {
      "Access-Token": token
    };

    const res = await this.postToApi(url, params, "Error revoking Tiktok token", headers);
    return res;
  }

  async revokeUserAccessToken(token){

    const url = `${TIKTOK_API_URL}/oauth2/revoke_token/`;
    const headers = {
      "Access-Token": token,
    };
    const params = {
      client_id: TIKTOK_APP_ID,
      client_secret: TIKTOK_APP_SECRET,
      access_token: token
    };
    try {
      await this.postToApi(url, params, "Error revoking Tiktok token", headers);
      return true;
    }
    catch(err){
      this.logger.error(`Error revoking Tiktok token ${err}`);
      return false;
    }
  }

  async deleteUserAccount(criteria) {
    await this.userAccountRepostiory.delete(criteria);
  }
}

module.exports = UserAccountService;
