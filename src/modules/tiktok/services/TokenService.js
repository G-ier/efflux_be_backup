const axios = require("axios");
const { TIKTOK_APP_ID, TIKTOK_APP_SECRET, TIKTOK_AUTH_CODE, baseUrl } = require("../constants");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class TokenService {
  constructor() {
    this.database = new DatabaseRepository();
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
      return await this.upsertUserAccount(data);
    } else {
      throw new Error("Error creating token");
    }
  }

  async upsertUserAccount(data) {
    return await this.database.upsert("user_accounts", data, "token");
  }

  async refreshTikTokToken() {
    // TODO: Implement token refreshing logic
    throw new Error("Not implemented");
  }
}

module.exports = TokenService;
