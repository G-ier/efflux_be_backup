// Local application imports
const AuthRepository                      = require('../repositories/AuthRepository');
const { FunnelFluxLogger }                = require("../../../shared/lib/WinstonLogger");
const BaseService                         = require("../../../shared/services/BaseService");
const {
  FunnelFluxApiBaseUrl
}                                         = require('../constants');

class AuthService extends BaseService {

  constructor() {
    super(FunnelFluxLogger);
    this.repository = new AuthRepository();
    this.accessToken = null;
  }

  async refreshToken(dbResponse) {

    this.logger.info('Refreshing the access token')
    const url = `${FunnelFluxApiBaseUrl}/auth/validate`;
    const refresh_token = dbResponse ? dbResponse.refresh_token : process.env.FUNNEL_FLUX_API_REFRESH_TOKEN;
    const acces_token = dbResponse ? dbResponse.access_token : process.env.FUNNEL_FLUX_API_ACCESS_TOKEN;
    const data = { refresh_token: refresh_token}
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${acces_token}`,
      'Content-Type': 'application/json'
    }

    return await this.postToApi(url, data, 'Error refreshing the access token', headers)
  }

  async getAccessToken() {

    if (this.accessToken && this.accessToken.expires_at > Date.now()) {
      this.logger.info('No need to fetch the access token from the database');
      return this.accessToken.access_token;
    }

    this.logger.info('Fetching access token from the database')

    // 1. Fetch the latest access token from the database
    const dbResponse = await this.repository.getLatestAccessToken()

    // 2. Check if the access token is valid
    if (dbResponse && dbResponse.expires_at > Date.now()) {
      this.logger.info("The access token is valid");
      this.accessToken = dbResponse;
      // 3. If the access token is valid, return it
      return dbResponse.access_token;
    }

    // 4. If the access token is not valid, get a new access token using the refresh token
    const updatedData = await this.refreshToken(dbResponse)

    // 5. Save the new access token in the database
    await this.executeWithLogging(
      () => this.repository.upsert(updatedData),
      "Error saving the new Funnel Flux access Token to the database"
    );

    this.logger.info("The new access token has been saved to the database");

    //6. Return the new access token
    const refreshedDbObject = await this.repository.getLatestAccessToken();
    this.accessToken = refreshedDbObject;
    return refreshedDbObject.access_token;

  }

}

module.exports = AuthService;
