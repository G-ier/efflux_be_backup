// Third party imports
const OAuth = require('oauth-1.0a');
const axios = require("axios");
const crypto = require('crypto');

class BaseService {

  constructor(logger) {
    this.logger = logger;
  }

  constructOAuth1Headers(method='GET', url, consumerKey, consumerSecret, token = null, tokenSecret = null) {
    // Initialize OAuth1.0a
    const oauth = OAuth({
      consumer: { key: consumerKey, secret: consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      }
    });

    // Prepare the OAuth Token
    let oauthToken = {};
    if (token && tokenSecret) {
      oauthToken = { key: token, secret: tokenSecret };
    }

    // OAuth authorization header
    const authorization = oauth.toHeader(oauth.authorize({
      url: url,
      method: method
    }, oauthToken));

    return {
      ...authorization,
      'Content-Type': 'application/json'
    };
  }

  async executeWithLogging(asyncFn, errorMsg) {
    try {
      return await asyncFn();
    } catch (error) {
      this.logger.error(`${errorMsg}: ${error.response.data.error}`);
      throw error;
    }
  }

  async fetchFromApi(url, params, errorMsg, headers = {}) {

    const constructApiUrl = (endpointUrl, params) => {
      const queryParams = new URLSearchParams(params).toString();
      return `${endpointUrl}?${queryParams}`;
    }

    const baseUrl = Object.keys(params).length > 0 ? constructApiUrl(url, params) : url;

    const fetch = async () => {
      const { data } = await axios.get(baseUrl, { headers });
      return data;
    }

    return await this.executeWithLogging(
      () => fetch() ,
      errorMsg
    );
  }

  async postToApi(url, body, errorMsg, headers = {}) {

    const fetch = async () => {
      const response = await axios.post(url, body, { headers });
      const { data } = response;
      return data;
    }

    return await this.executeWithLogging(
      () => fetch() ,
      errorMsg
    );
  }

  async putToApi(url, body, errorMsg, headers = {}) {

    const fetch = async () => {
      const response = await axios.put(url, body, { headers });
      const { data } = response;
      return data;
    }

    return await this.executeWithLogging(
      () => fetch() ,
      errorMsg
    );
  }

}

module.exports = BaseService;
