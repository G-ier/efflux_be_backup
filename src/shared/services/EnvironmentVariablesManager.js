// Load the AWS SDK
const { SecretsManagerClient, GetSecretValueCommand }   = require("@aws-sdk/client-secrets-manager");
const { SSMClient, GetParameterCommand }                = require("@aws-sdk/client-ssm");

class EnvironmentVariablesManager {

  static instance = null;

  static secrets = [
    // Database
    'DATABASE_URL', 'DATABASE_URL_STAGING', 'OLD_PRODUCTION_DATABASE_URL',
    // Facebook
    'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_PIXEL_TOKEN',
    // Sedo
    'SEDO_PARTNERID', 'SEDO_SIGNKEY', 'SEDO_USERNAME', 'SEDO_PASSWORD',
    // Funnel Flux
    'FUNNEL_FLUX_API_ACCESS_TOKEN', 'FUNNEL_FLUX_API_REFRESH_TOKEN',
    // AUTH0
    'AUTH0_AUDIENCE', 'AUTH0_DOMAIN', 'AUTH0_API', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET',
    // Google API Key File
    'GOOGLE_API_KEY_FILE',
  ];

  static parameters = [

    // CRONS
    'DISABLE_CRON', 'DISABLE_CROSSROADS_CRON', 'DISABLE_SEDO_CRON', 'DISABLE_FACEBOOK_CRON', 'DISABLE_TIKTOK_CRON',
    'DISABLE_FUNNEL_FLUX_CRON', 'DISABLE_AGGREGATES_UPDATE_CRON', 'DISABLE_REVEALBOT_SHEET_CRON',
    'DISABLE_TIKTOK_CROSSROADS_REVEALBOT_SHEET_CRON', 'DISABLE_TIKTOK_SEDO_REVEALBOT_SHEET_CRON', 'DISABLE_FACEBOOK_CROSSROADS_REVEALBOT_SHEET_CRON',
    'DISABLE_FACEBOOK_SEDO_REVEALBOT_SHEET_CRON',

    // Server settings
    'DATABASE_ENVIRONMENT', 'PORT', 'DISABLE_SLACK_NOTIFICATION', 'CRON_ENVIRONMENT', 'DISABLE_AUTH_DEADLOCK',

    // Logging
    'LOGGING_ENVIRONMENT', 'LOG_LEVEL'
  ]

  constructor() {
    if (!EnvironmentVariablesManager.instance) {
      // Check if the runtime environment is development or production
      this.environmentLocation = process.env.ENVIRONMENT_LOCATION === 'local' ? 'Local' : 'AWS Cloud'
      this.region = 'us-east-1';
      this.secretsManager = new SecretsManagerClient({
        region: this.region
      });
      this.parametersManager = new SSMClient({
        region: this.region
      });
      this.cachedValues = {}; // Object to hold cached secrets
      EnvironmentVariablesManager.instance = this;
    }
    return EnvironmentVariablesManager.instance;
  }

  // Retrieve a parameter from the AWS SSM Parameter Store
  async retrieveParameter(parameterName) {

    // Check if the parameter is stored in the parameters manager
    if (!EnvironmentVariablesManager.parameters.includes(parameterName)) {
      throw new Error(`No secret ${parameterName} stored in manager`);
    }

    try {
      const params = {
        Name: parameterName,
        WithDecryption: true
      };
      const data = await this.parametersManager.send(new GetParameterCommand(params));

      // Parse the parameter value & store it in the cache
      const parameterValue = data.Parameter.Value;
      this.cachedValues[parameterName] = parameterValue;
      return parameterValue;

    } catch (error) {
      console.error(`Error retrieving parameter ${parameterName}: ${error}`);
      return null;
    }
  }

  // Retrieve a secret from the AWS Secrets Manager
  async retrieveSecret(secretName, singleValue=true) {

    // Check if the secret is stored in the manager
    if (!EnvironmentVariablesManager.secrets.includes(secretName)) {
      throw new Error(`No secret ${secretName} stored in manager`);
    }

    try {
      const params = {
        SecretId: secretName,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      };
      const data = await this.secretsManager.send(new GetSecretValueCommand(params));

      // Parse the secret value & store it in the cache
      const secretString = data.SecretString;
      const secretValue = secretString ? JSON.parse(secretString) : null;
      const value = (singleValue && secretValue) ? secretValue[secretName] : secretValue;
      this.cachedValues[secretName] = value;
      return value;

    } catch (error) {
      console.error(`Error retrieving secret ${secretName}: ${error}`);
      return null;
    }
  }

  // Initialize the service by retrieving all secrets
  async init() {
    if (this.environmentLocation === 'Local') {
      const envVars = EnvironmentVariablesManager.secrets.concat(EnvironmentVariablesManager.parameters);
      for (const secretName of envVars) {
        this.cachedValues[secretName] = process.env[secretName];
      }
    } else {
      for (const secretName of EnvironmentVariablesManager.secrets) {
        await this.retrieveSecret(secretName, secretName !== 'GOOGLE_API_KEY_FILE');
      }
      for (const parameterName of EnvironmentVariablesManager.parameters) {
        await this.retrieveParameter(parameterName);
      }
    }
  }

  // Get an env variable from the cache
  getEnvVariable(envVariableName) {
    return this.cachedValues[envVariableName] ? this.cachedValues[envVariableName] : null;
  }

}

// Export as a singleton
const instance = new EnvironmentVariablesManager();
Object.freeze(instance);

module.exports = instance;
