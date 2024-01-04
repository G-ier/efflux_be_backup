// Local application imports
const BaseService                   = require("../../../shared/services/BaseService");
const AccountsRepository            = require("../repositories/AccountsRepository");
const { TonicLogger }               = require("../../../shared/lib/WinstonLogger");

class AuthenticationService extends BaseService {

  static instance = null;

  constructor() {
    if (AuthenticationService.instance) {
      return AuthenticationService.instance;
    }

    super(TonicLogger);
    this.repository = new AccountsRepository();
    this.tokenCache = {};

    AuthenticationService.instance = this;
  }

  static getInstance() {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  async fetchTonicAccounts() {
    return await this.repository.fetchAccounts();
  }

  async authenticate(email, cKey, cSecret) {

    const step1Url = 'https://api.publisher.tonic.com/oauth/token/request'
    let headers = this.constructOAuth1Headers('POST', step1Url, cKey, cSecret);
    let { oauth_token: temp_oauth_token, oauth_token_secret: temp_oauth_token_secret } = await this.postToApi(step1Url, {}, 'Error initating oauth1', headers);

    const step2Url = 'https://api.publisher.tonic.com/oauth/token/verify'
    headers = this.constructOAuth1Headers('POST', step2Url, cKey, cSecret, temp_oauth_token, temp_oauth_token_secret);
    const { oauth_verifier } = await this.postToApi(step2Url, {}, 'Error verifying access token', headers);

    const step3Url = `https://api.publisher.tonic.com/oauth/token/access?oauth_verifier=${oauth_verifier}`
    headers = this.constructOAuth1Headers('POST', step3Url, cKey, cSecret, temp_oauth_token, temp_oauth_token_secret);
    let { oauth_token, oauth_token_secret, expires } = await this.postToApi(step3Url, {}, 'Error getting authenticated token', headers);

    this.tokenCache[email] = {
      token: oauth_token,
      tokenSecret: oauth_token_secret,
      // Convert the expires time from seconds to milliseconds
      expires: expires * 1000,
    };
  }

  async getAccessToken(email, cKey, cSecret) {

    const tokenCacheInstance = this.tokenCache[email];

    if (tokenCacheInstance?.token && tokenCacheInstance?.expires > Date.now()) {
      return { token: tokenCacheInstance.token, tokenSecret: tokenCacheInstance.tokenSecret };
    }
    this.logger.info('Refreshing the access token from Tonic')
    await this.authenticate(email, cKey, cSecret);
    this.logger.info('Access token refreshed successfully');
    return { token: this.tokenCache[email].token, tokenSecret: this.tokenCache[email].tokenSecret };
  }

}

module.exports = AuthenticationService;
