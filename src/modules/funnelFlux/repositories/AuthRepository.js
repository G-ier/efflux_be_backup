// Local application imports
const DatabaseRepository                = require("../../../shared/lib/DatabaseRepository");
const AccessToken                       = require('../entities/AccessToken');

class AuthRepository {

  constructor() {
    this.tableName = "funnel_flux_auth_token";
    this.database = new DatabaseRepository();
  }

  async saveOne(apiResponse) {
    const data = this.toDatabaseDTO(apiResponse);
    const response = await this.database.insert(this.tableName, data);
    return response;
  }

  async upsert(apiResponse) {
    let data = this.toDatabaseDTO(apiResponse);
    if (typeof data === "object") data = [data];
    const response = await this.database.upsert(this.tableName, data, "user_id");
    return response;
  }

  async getLatestAccessToken(fields=['*'], filters={}) {
    const response = await this.database.queryOne(this.tableName, fields, filters, [{column: 'expires_at', direction: 'desc'}]);
    if (response) return this.toDomainEntity(response);
    return null
  }

  async findOne(fields, filters, orderBy) {
    const response = await this.database.queryOne(this.tableName, fields, filters, orderBy);
    if (response) return this.toDomainEntity(response);
    return null
  }

  toDatabaseDTO(apiResponse) {

    const accessToken = {
      access_token: apiResponse.tokens.access_token,
      refresh_token: apiResponse.tokens.refresh_token,
      expires_at: apiResponse.tokens.expires_at,
      user_id: apiResponse.user.user_id
    }

    return accessToken;
  }

  toDomainEntity(dbObject) {
    const accessToken = new AccessToken(
      dbObject.access_token,
      dbObject.refresh_token,
      dbObject.expires_at,
      dbObject.user_id
    );

    return accessToken;
  }

}

module.exports = AuthRepository
