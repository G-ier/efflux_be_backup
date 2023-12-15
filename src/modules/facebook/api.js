const axios = require('axios');
const { FB_API_URL } = require('./constants');
const UserAccountService = require('./services/UserAccountService');

const userAccountService = new UserAccountService();

async function getToken(adminsOnly = true) {
  return (await userAccountService.getFetchingAccount(adminsOnly)).token;
}

const api = axios.create({
  baseURL: FB_API_URL,
});

// Add interceptors for request
api.interceptors.request.use(
  async (config) => {
    try {
      const access_token = await getToken();
      // Check if the token is available
      if (access_token) {
        // Attach the token based on the request method
        if (config.method === 'get') {
          // For GET requests, add the token as a query parameter
          config.params = { ...config.params, access_token };
        } else if (config.method === 'post') {
          // For POST requests, add the token to the request body
          config.data = { ...config.data, access_token };
        }
        // Add similar conditions for other request methods if needed
      }
    } catch (error) {
      // Handle error in getting token
      return Promise.reject(error);
    }

    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  },
);

module.exports=api;
