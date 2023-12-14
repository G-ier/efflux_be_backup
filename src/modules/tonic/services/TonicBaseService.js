// Local application imports
const BaseService                 = require("../../../shared/services/BaseService");
const AuthenticationService       = require('./AuthenticationService');
const { TonicLogger }             = require("../../../shared/lib/WinstonLogger");
const { TONIC_BASE_URL }          = require('../constants');

class TonicBaseService extends BaseService {

  constructor () {
    super(TonicLogger)
    this.authService = new AuthenticationService();
  }

  async makeTonicAPIRequest(requestMethod, endpoint, paramsORbody, errorMessage) {

    const availableRequestMethods = ['GET', 'POST'];
    if (!availableRequestMethods.includes(requestMethod)) {
      throw new Error(`requestMethod must be one of ${availableRequestMethods}`);
    }

    const url = `${TONIC_BASE_URL}/${endpoint}`;
    const { token, tokenSecret } = await this.authService.getAccessToken();
    const authorizationHeader = this.constructOAuth1Headers(requestMethod, url, this.authService.CONSUMER_KEY, this.authService.CONSUMER_SECRET, token, tokenSecret);
    let response;
    if (requestMethod === 'GET') {
      response = await this.fetchFromApi(url, {}, errorMessage, authorizationHeader)
    } else if (requestMethod === 'POST') {
      response = await this.postToApi(url, paramsORbody, errorMessage, authorizationHeader)
    }
    return response
  }

}

module.exports = TonicBaseService;
