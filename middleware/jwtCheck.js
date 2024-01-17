// Third party imports
require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

module.exports = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/.well-known/jwks.json`,
  }),
  audience: EnvironmentVariablesManager.getEnvVariable('AUTH0_AUDIENCE'),
  issuer: `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/`,
  algorithms: ['RS256'],
});
