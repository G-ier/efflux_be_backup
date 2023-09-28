// Local application imports
const Auth0Service = require("../services/Auth0Service");
const UserService = require("../services/UserService");
const _ = require("lodash");

class Auth0Controller {

  constructor() {
    this.auth0Service = new Auth0Service();
    this.userService = new UserService();
  }

  // Method to handle user login
  async login(req, res) {
    try {
      const user = req.user;
      const account = req.body;
      const userDetails = await this.auth0Service.login(user, account);

      const isAdmin = user.permissions.includes('admin');

      let users = await this.userService.getQueriedUsers(isAdmin);
      users = _(users)
        .groupBy("id")
        .mapValues((items) => {
          const { id, name, ad_account_id, accountType } = items[0];
          const ad_accounts = ad_account_id
            ? items.map((item) => ({
                id: item.ad_account_id,
                name: item.ad_account_name,
                provider: item.ad_account_provider,
              }))
            : [];

          return { accountType, userId: id, name, ad_accounts };
        })
        .map();

      const groupedUsers = _(users).groupBy("accountType").value();

      const { acct_type: accountType, id: userId, name, email } = userDetails;
      const result = {
        userDetails: {
          accountType,
          userId,
          name,
          email,
          token: user.token,
        },
        roleData: {
          admin: {
            users: groupedUsers["admin"].map((item) => {
              const { accountType, ...rest } = item;
              return rest;
            }),
          },
          mediaBuyer: groupedUsers["media_buyer"].map((item) => {
            const { accountType, ...rest } = item;
            return rest;
          }),
        },
      };
      res.json(result);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("Failed to login using Auth0.");
    }
  }

  // Method to handle user creation
  async createUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await this.auth0Service.createAuth0User({ email, password });
      res.json(user);
    } catch (error) {
      console.error("Error during user creation:", error);
      res.status(500).send("Failed to create user using Auth0.");
    }
  }
}

module.exports = Auth0Controller;
