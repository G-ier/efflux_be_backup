const UserAccountService = require('../services/UserAccountService');


class UserAccountController {

  constructor() {
    this.userAccountService = new UserAccountService();
  }

  async addFacebookUserAccount(req, res) {
    try {
      const accountDetails = req.body;
      const user_id = req.user.id;

      // Destructure the account details from the request body.
      const { name, email, provider, providerId: provider_id, imageUrl: image_url, accessToken } = accountDetails;
      const exists = await this.userAccountService.fetchUserAccounts(['*'], { provider, provider_id }, 1)
      if (exists.length > 0) {
        return res.status(200).json({
          message: `Account already exists for ${name} | ${process.env.FACEBOOK_APP_ID}`
        });
      }

      // Get the long-lived token from Facebook.
      const token = await this.userAccountService.getFacebookLongToken(accessToken);
      const account = {
        name,
        email,
        provider,
        provider_id,
        image_url,
        status: "active",
        user_id,
        token
      }
      // Save the account to our database.
      const id = await this.userAccountService.saveUserAccountToDB(account);

      // Return the response to the user.
      res.status(200).json({
        userId: id
      });

    } catch(error) {
      console.error(error);
      res.status(500).json({message: error.message, error})
    }
  }

  async reauthorizeFacebookUserAccount(req, res) {

    // The basic idea is, locate the user account in our database, get a new token, and update the account.
    const accountId = req.body.accountId;
    const accountDetails = req.body.user;
    const { name, accessToken, providerId: provider_id, imageUrl: image_url } = accountDetails;

    // Locate the account in our database.
    const foundAccount = await this.userAccountService.fetchUserAccounts(['*'], { id: accountId }, 1);

    if (foundAccount.length === 0) res.status(400).json({ message: `Account does not exist` });
    if (foundAccount[0].provider_id !== provider_id) res.status(400).json(
      { message: `"Reauthorize under another account is forbidden"` });

    // Get the long-lived token from Facebook.
    const token = await this.userAccountService.getFacebookLongToken(accessToken);

    // Update the account in our database.
    await this.userAccountService.updateUserAccount({ id: accountId, provider_id }, {
      name,
      image_url,
      token
    })
    res.status(200).json({
      message: `Successfully updated account for ${name} | ${process.env.FACEBOOK_APP_ID}`
    });
  }

  // DATABASE CASCADE IS UNTESTED FOR DELETION - TEST LATER ON
  // THE PROBLEM IS THAT WHEN WE DELETE A USER ACCOUNT FROM THE DATABSE, WE WANT TO CASCADE ON DELETE
  // ON EVERY TABLE THAT REFERENCES USER_ACCOUNTS. THIS IS NOT POSSIBLE WITH KNEX. I ALTERED THE
  // DATABASE FOR MOST OF THE FOREIGN KEYS TO CASCADE ON DELETE, BUT I DID NOT DO TEST IT BECAUSE I HAD
  // TO SHIFT PRIORITIES TO OTHER THINGS. TEST THIS LATER ON.
  async deleteFacebookUserAccount(req, res) {
    const accountId = req.body.accountId;

    // Revoke the token from Facebook.
    const account = await this.userAccountService.fetchUserAccounts(['*'], { id: accountId }, 1);
    const { name, token, provider_id } = account[0];
    const result = await this.userAccountService.revokeFacebookToken(token, provider_id);
    if (!result) res.status(400).json({ message: `Failed to revoke token for ${name} | ${process.env.FACEBOOK_APP_ID}` });

    // We need to alter the database to cascade on delete for every table that references user_accounts.
    await this.userAccountService.deleteUserAccount({ id: accountId });
    res.status(200).json({
      message: `Successfully deleted account for ${name} | ${process.env.FACEBOOK_APP_ID}`
    });

  }

  async fetchUserAccountsByUserId(req, res) {
    const userId = req.user.id;
    const userAccounts = await this.userAccountService.fetchUserAccounts(['*'], { user_id: userId });
    res.status(200).json(userAccounts);
  }

}

module.exports = UserAccountController;
