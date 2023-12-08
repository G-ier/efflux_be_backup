const UserAccountService = require("../services/UserAccountService");

class UserAccountController {

  constructor() {
    this.userAccountService = new UserAccountService();
  }

  async addAccountFromAuthToken(req, res){
    const { auth_code } = req.body;
    const user_id = req.user_id;

    // Check if the auth code is provided.
    if (!auth_code) throw new Error("Auth code is required");

    const response = await this.userAccountService.getTaboolaAdvertiserTokenFromAuthCode(auth_code);

    console.log(response);
  }

  async refreshNetworkAccount(req, res){
    try {
      const response = await this.userAccountService.getTaboolaAdvertiserTokenFromClient();
      await this.userAccountService.syncTaboolaNetworkAccount(response.access_token);

      // Return the response to the user.
      res.status(200).json({
        message: "Successfully refreshed network Account Data",
        access_token: response.access_token,
      });    
    }
    catch(error){
      console.error(error);
      res.status(500).json({message: error.message, error});
    }
  }
}

module.exports = UserAccountController;