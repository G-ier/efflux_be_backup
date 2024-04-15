// Third part imports
const axios = require('axios');

// Local application imports
const UserService = require('./UserService');
const RoleService = require('./RoleService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class Auth0Service {
  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService()
  }

  async getAuth0AccessToken() {
    try {
      const result = await axios.post(`https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/oauth/token`, {
        client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
        client_secret: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_SECRET'),
        audience: EnvironmentVariablesManager.getEnvVariable('AUTH0_API'),
        grant_type: 'client_credentials',
      })
      
      if (result.status === 200 && result.data.access_token !== null) {
        return `${result.data.token_type} ${result.data.access_token}`;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching Auth0 access token', error);
      return null;
    }
  }

  async getAuth0User(sub) {
    const Authorization = await this.getAuth0AccessToken();

    const { data: user } = await axios.get(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users/${sub}`,
      {
        headers: {
          Authorization,
        },
      },
    );

    return user;
  }

  async createAuth0User({ email, password, fullName }) {
    const Authorization = await this.getAuth0AccessToken();
    return axios.post(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users`,
      {
        email,
        password,
        name: fullName,
        connection: 'Username-Password-Authentication',
      },
      {
        headers: {
          Authorization,
        },
      },
    );
  }
  

  getUserIdentity(userFromAuth0) {
    const oauthProviders = ['facebook', 'google'];
    const oauthIdentity = userFromAuth0.identities.find(
      (identity) => oauthProviders.indexOf(identity.provider) !== -1,
    );
    const auth0Identity = userFromAuth0.identities.find(
      (identity) => identity.provider === 'auth0',
    );

    return {
      provider: oauthIdentity ? oauthIdentity.provider : 'auth0',
      providerId: oauthIdentity ? oauthIdentity.user_id : auth0Identity.user_id,
    };
  }

  async login(reqUser, account) {
    const { name, email, image_url, nickname, sub } = account;
    const acct_type = reqUser?.roles?.includes('admin') ? 'admin' : 'media_buyer';
    const userFromAuth0 = await this.getAuth0User(sub);
    const identity = this.getUserIdentity(userFromAuth0);

    const user = await this.userService.fetchOne(['*'], {email});

    // If it doesn't exist, create a user in the database
    if (!user) {
      const role = await this.roleService.fetchOne(["*"],{name:acct_type?.replace("_"," ")})
      const userId = await this.userService.saveUser({
        name,
        nickname,
        email,
        image_url,
        sub,
        acct_type,
        role:role?.id,
        org_id:1,
        ...identity,
      });

      return { id: userId,...user, ...userFromAuth0, };
    }
    // If the user exists but his permissions are different, update them
    else {
      if (user.acct_type !== acct_type)
        await this.userService.updateUser({ acct_type }, { id: user.id });
      return { id: user.id, acct_type: acct_type,...user, ...userFromAuth0  };
    }
  }
}

module.exports = Auth0Service;
