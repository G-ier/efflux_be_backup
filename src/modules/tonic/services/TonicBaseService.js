// Local application imports
const BaseService                                 = require("../../../shared/services/BaseService");
const AuthenticationService                       = require('./AuthenticationService');
const { TonicLogger }                             = require("../../../shared/lib/WinstonLogger");
const { TONIC_BASE_URL }          = require('../constants');

class TonicBaseService extends BaseService {

  constructor () {
    super(TonicLogger)
    this.authService = AuthenticationService.getInstance();
  }

  async makeTonicAPIRequest(account, requestMethod, endpoint, paramsORbody, errorMessage) {

    // Makes the same request to the Tonic API for each account

    const availableRequestMethods = ['GET', 'POST'];
    if (!availableRequestMethods.includes(requestMethod)) {
      throw new Error(`requestMethod must be one of ${availableRequestMethods}`);
    }

    const url = `${TONIC_BASE_URL}/${endpoint}`;
    let response;
    const { token, tokenSecret } = await this.authService.getAccessToken(account.email, account.ckey, account.csecret);
    const authorizationHeader = this.constructOAuth1Headers(requestMethod, url, account.ckey, account.csecret, token, tokenSecret);
    if (requestMethod === 'GET') {
      response = await this.fetchFromApi(url, {}, errorMessage, authorizationHeader)
    } else if (requestMethod === 'POST') {
      response = await this.postToApi(url, paramsORbody, errorMessage, authorizationHeader)
    }
    return response;
  }

}

module.exports = TonicBaseService;
