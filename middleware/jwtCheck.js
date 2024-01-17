// Third party imports
require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
// const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

module.exports = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/.well-known/jwks.json`,
  }),
  // Validate the audience and the issuer.
  audience: EnvironmentVariablesManager.getEnvVariable('AUTH0_AUDIENCE'),
  issuer: `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/`,
  algorithms: ['RS256'],
});
