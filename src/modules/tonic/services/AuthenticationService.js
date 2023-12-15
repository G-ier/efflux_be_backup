// Local application imports
const BaseService                 = require("../../../shared/services/BaseService");
const { TonicLogger }             = require("../../../shared/lib/WinstonLogger");

class AuthenticationService extends BaseService {

  constructor () {
    super(TonicLogger);
    this.token = null;
    this.tokenSecret = null;
    this.expires = null;
    this.CONSUMER_KEY = '7c618919da905b797512678c546046eef9a4e2b36221e8f183c468522a5e3d24';
    this.CONSUMER_SECRET = '07d2fbbc843a7c74f084820e94e172b511c5decb63bbcc3b576e3d47ac737f31';
  }

  async authenticate() {

    const step1Url = 'https://api.publisher.tonic.com/oauth/token/request'
    let headers = this.constructOAuth1Headers('POST', step1Url, this.CONSUMER_KEY, this.CONSUMER_SECRET);
    let { oauth_token: temp_oauth_token, oauth_token_secret: temp_oauth_token_secret } = await this.postToApi(step1Url, {}, 'Error initating oauth1', headers);

    const step2Url = 'https://api.publisher.tonic.com/oauth/token/verify'
    headers = this.constructOAuth1Headers('POST', step2Url, this.CONSUMER_KEY, this.CONSUMER_SECRET, temp_oauth_token, temp_oauth_token_secret);
    const { oauth_verifier } = await this.postToApi(step2Url, {}, 'Error verifying access token', headers);

    const step3Url = `https://api.publisher.tonic.com/oauth/token/access?oauth_verifier=${oauth_verifier}`
    headers = this.constructOAuth1Headers('POST', step3Url, this.CONSUMER_KEY, this.CONSUMER_SECRET, temp_oauth_token, temp_oauth_token_secret);
    let { oauth_token, oauth_token_secret, expires } = await this.postToApi(step3Url, {}, 'Error getting authenticated token', headers);

    this.token = oauth_token;
    this.tokenSecret = oauth_token_secret;
    // Convert the expires time from seconds to milliseconds
    this.expires = expires * 1000;
  }

  async getAccessToken() {

    if (this.token && this.expires > Date.now()) {
      return { token: this.token, tokenSecret: this.tokenSecret };
    }
    this.logger.info('Refreshing the access token from Tonic')
    await this.authenticate();
    this.logger.info('Access token refreshed successfully');
    return { token: this.token, tokenSecret: this.tokenSecret };
  }

}


module.exports = AuthenticationService;
