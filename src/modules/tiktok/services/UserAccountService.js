const axios = require("axios");
const { FETCHING_USER_ACCOUNT_ID, TIKTOK_APP_ID, TIKTOK_APP_SECRET, TIKTOK_AUTH_CODE, baseUrl } = require("../constants");
const UserAccountRepository = require("../repositories/UserAccountRepository");

class UserAccountService {

  constructor() {
    this.userAccountRepostiory = new UserAccountRepository();
  }

  async getFetchingAccounts() {
    const userAccounts = await this.userAccountRepostiory.fetchUserAccounts(
      ["id", "user_id", "token"],
      { provider: "tiktok", id: FETCHING_USER_ACCOUNT_ID }
    );
    if (userAccounts.length === 0) throw new Error("No fetching accounts found for tik-tok")
    console.log("userAccounts: ", userAccounts[0]);
    return userAccounts[0];
  }

  async getTikTokToken() {

    const url = `${baseUrl}/oauth2/access_token/`;
    const params = {
      app_id: TIKTOK_APP_ID,
      auth_code: TIKTOK_AUTH_CODE,
      secret: TIKTOK_APP_SECRET,
    };
    const headers = {
      "Content-Type": "application/json",
    };

    const res = await axios.post(url, params, { headers });

    if (res.data.code === 0) {
      const data = {
        email: "deni.haxhiu13@gmail.com",
        provider: "tiktok",
        provider_id: res.data.request_id,
        status: "active",
        token: res.data.access_token,
        user_id: 1,
      };
      return await this.userAccountRepostiory.upsert(data);
    } else {
      throw new Error("Error creating token");
    }
  }

  async refreshTikTokToken() {
    throw new Error("Not implemented");
  }

}

module.exports = UserAccountService;
