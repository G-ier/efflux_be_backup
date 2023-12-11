const UserAccountService = require("../services/UserAccountService");

class UserAccountController {

  constructor() {
    this.userAccountService = new UserAccountService();
  }

  async addAdvertiserAccount(req, res) {
    try {
      const { auth_code } = req.body;
      const user_id = req.user.id;

      // Check if the auth code is provided.
      if (!auth_code) throw new Error("Auth code is required");

      // Get the access token from TikTok.
      const response = await this.userAccountService.getTikTokAdvertiserToken(auth_code);
      const data = response.data;

      // Get USER info from TikTok.
      const userInfo = await this.userAccountService.getUserInfo(data.access_token, data.open_id);

      // Save the access token to the database.
      if (response.code === 0) {
        const account_data = {
          name: userInfo.data.display_name,
          email: userInfo.data.email,
          provider: "tiktok",
          provider_id: userInfo.data.core_user_id,
          status: "active",
          token: data.access_token,
          user_id: user_id
        };
        await this.userAccountService.upsertAccountToDB(account_data);
      } else {
        throw new Error("Error upserting account to database");
      }

      const account = await this.userAccountService.fetchAccountFromDatabase(['id'], {provider_id: userInfo.data.core_user_id});
      const accountId = account[0].id;

      // Return the response to the user.
      res.status(200).json({
        message: "Successfully added TikTok user account",
        auth_code: auth_code,
        userId: accountId
      });

    } catch(error) {
      console.error(error);
      res.status(500).json({message: error.message, error})
    }
  }

  async addTiktokUserAccount(req, res) {

    try {
      const { auth_code } = req.body;
      const user_id = req.user.id;

      // Check if the auth code is provided.
      if (!auth_code) throw new Error("Auth code is required");

      // Get the access token from TikTok.
      const response = await this.userAccountService.getTikTokUserToken(auth_code);
      const data = response.data;

      // Get USER info from TikTok.
      const profileData = await this.userAccountService.getProfileData(data.access_token, data.open_id);

      // Calculate the expiration date for the access token - 1 day.
      const expires_in_ts = new Date(new Date().getTime()  + (data.expires_in * 1000))
      const refresh_token_expires_in_ts = new Date(new Date().getTime() + (data.refresh_token_expires_in * 1000))

      // Save the access token to the database.
      if (response.code === 0) {
        const account_data = {
          name: profileData.data.username,
          provider: "tiktok",
          provider_id: data.open_id,
          status: "active",
          token: data.access_token,
          user_id: user_id,
          expires_in: expires_in_ts,
          refresh_token: data.refresh_token,
          refresh_token_expires_in: refresh_token_expires_in_ts
        };
        await this.userAccountService.upsertAccountToDB(account_data);
      } else {
        throw new Error("Error upserting account to database");
      }

      // Return the response to the user.
      res.status(200).json({
        message: "Successfully added TikTok user account",
        auth_code: auth_code,
        userId: user_id
      });

    } catch(error) {
      console.error(error);
      res.status(500).json({message: error.message, error})
    }
  }

  async refreshUserTokens(req, res) {
    await this.userAccountService.refreshUserAccessTokens();
  }

  async deteleTitkokAdvertiserAccount(req, res) {
    const accountId = req.body.accountId;
    const account = await this.userAccountService.fetchAccountFromDatabase(['name', 'token'], {id: accountId});
    const { name, token } = account[0];
    const result = await this.userAccountService.revokeAdvertiserAccessToken(token);
    if (!result) res.status(400).json({ message: `Failed to revoke token for ${name}` });

    await this.userAccountService.deleteUserAccount({ id: accountId });
    res.status(200).json({
      message: `Successfully deleted account for ${name}`
    });
  }

  async deleteTiktokUserAccount(req, res) {
    const accountId = req.body.accountId;
    const account = await this.userAccountService.getFetchingAccounts({id: accountId});
    const { name, token } = account[0];
    const result = await this.userAccountService.revokeAccessToken(token);

    if (!result) res.status(400).json({ message: `Failed to revoke token for ${name}` });

    await this.userAccountService.deleteUserAccount({ id: accountId });
    res.status(200).json({
      message: `Successfully deleted account for ${name}`});
  }
}

module.exports = UserAccountController;
