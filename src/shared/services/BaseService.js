const axios = require("axios");

class BaseService {

  constructor(logger) {
    this.logger = logger;
  }

  async executeWithLogging(asyncFn, errorMsg) {
    try {
      return await asyncFn();
    } catch (error) {
      this.logger.error(`${errorMsg}: ${error}`);
      throw error;
    }
  }

  async fetchFromApi(url, params, errorMsg, headers = {}) {

    const constructApiUrl = (endpointUrl, params) => {
      const queryParams = new URLSearchParams(params).toString();
      return `${endpointUrl}?${queryParams}`;
    }

    const baseUrl = constructApiUrl(url, params);

    const fetch = async () => {
      const { data } = await axios.get(baseUrl, { headers });
      return data;
    }

    return await this.executeWithLogging(
      () => fetch() ,
      errorMsg
    );
  }
}

module.exports = BaseService;
