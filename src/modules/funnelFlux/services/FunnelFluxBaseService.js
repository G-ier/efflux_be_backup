// Local application imports
const AuthService                         = require('../services/AuthService');
const { FunnelFluxLogger }                = require("../../../shared/lib/WinstonLogger");
const BaseService                         = require("../../../shared/services/BaseService");
const {
  FunnelFluxApiBaseUrl
}                                         = require('../constants');

class FunnelFluxBaseService extends BaseService {

  constructor() {
    super(FunnelFluxLogger);
    this.authService = new AuthService();
  }

  async makeFunnelFluxApiRequest(requestMethod, endpoint, paramsORbody, errorMessage) {

    // Validate requestMethod
    const availableRequestMethods = ['GET', 'POST', 'PUT'];

    if (!availableRequestMethods.includes(requestMethod)) {
      throw new Error(`requestMethod must be one of ${availableRequestMethods}`);
    }

    const url         = `${FunnelFluxApiBaseUrl}/${endpoint}`;
    const accessToken = await this.authService.getAccessToken();
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    let response;
    if (requestMethod === 'GET') {
      response = await this.fetchFromApi(url, paramsORbody, errorMessage, headers)
    } else if (requestMethod === 'POST') {
      response = await this.postToApi(url, paramsORbody, errorMessage, headers)
    } else if (requestMethod === 'PUT') {
      response = await this.putToApi(url, paramsORbody, errorMessage, headers)
    }
    return response
  }

}

module.exports = FunnelFluxBaseService;
