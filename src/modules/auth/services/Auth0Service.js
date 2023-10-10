const axios = require("axios");
const UserService = require("./UserService");

class Auth0Service {

  constructor() {
    this.userService = new UserService();
  }

  async getAuth0AccessToken() {
    const { data, status } = await axios
      .post(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: process.env.AUTH0_API,
          grant_type: "client_credentials",
        },
        {
          headers: { "content-type": "application/json" },
        }
      )
      .catch((err) => {
        console.error("Error fetching Auth0 access token", err);
      });

    if (status !== 200) {
      return null;
    }

    const { access_token, token_type } = data;
    return `${token_type} ${access_token}`;
  }

  async getAuth0User(sub) {
    const Authorization = await this.getAuth0AccessToken();

    const { data: user } = await axios.get(`${process.env.AUTH0_API}users/${sub}`, {
      headers: {
        Authorization,
      },
    });

    return user;
  }

  async createAuth0User({ email, password }) {
    const Authorization = await this.getAuth0AccessToken();
    return axios.post(
      `${process.env.AUTH0_API}users`,
      {
        email,
        password,
        connection: "Username-Password-Authentication",
      },
      {
        headers: {
          Authorization,
        },
      }
    );
  }

  getUserIdentity(userFromAuth0) {
    const oauthProviders = ["facebook", "google"];
    const oauthIdentity = userFromAuth0.identities.find((identity) => oauthProviders.indexOf(identity.provider) !== -1);
    const auth0Identity = userFromAuth0.identities.find((identity) => identity.provider === "auth0");

    return {
      provider: oauthIdentity ? oauthIdentity.provider : "auth0",
      providerId: oauthIdentity ? oauthIdentity.user_id : auth0Identity.user_id,
    };
  }

  async login(reqUser, account) {

    const { name, email, image_url, nickname, sub } = account;
    const acct_type = reqUser.permissions.includes("admin") ? "admin" : "media_buyer";
    const userFromAuth0 = await this.getAuth0User(sub);
    const identity = this.getUserIdentity(userFromAuth0);
    const user = await this.userService.fetchOne(['*'], identity);

    // If it doesn't exist, create a use in the database
    if (!user) {
      const userId = await this.userService.saveUser({
        name,
        nickname,
        email,
        image_url,
        sub,
        acct_type,
        ...identity
      });
      return { id: userId, ...userFromAuth0 };
    }
    // If the user exists but his permissions are different, update them
    else {
      if (user.acct_type !== acct_type) await this.userService.updateUser(
        { acct_type }, { id: user.id }
      );
      return { id: user.id, acct_type: acct_type, ...userFromAuth0 };
    }
  }
}

module.exports = Auth0Service;
