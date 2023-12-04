const UserAccountService = require("../services/UserAccountService");

class UserAccountController {

  constructor() {
    this.userAccountService = new UserAccountService();
  }

  async addAccountFromAuthToken(req, res){
    const { auth_code } = req.body;
    const user_id = req.user.id;

    // Check if the auth code is provided.
    if (!auth_code) throw new Error("Auth code is required");

    const response = await this.userAccountService.getTaboolaAdvertiserTokenFromAuthCode(auth_code);

    console.log(response);
  }

  async addAccount(req, res){
    try {
      const response = await this.userAccountService.getTaboolaAdvertiserTokenFromClient();

      console.log(response);
      // Return the response to the user.
      res.status(200).json({
        message: "Successfully added TikTok user account",
        auth_code: auth_code,
        userId: user_id
      });    
    }
    catch(error){
      console.error(error);
      res.status(500).json({message: error.message, error});
    }
  }
}

module.exports = UserAccountController;