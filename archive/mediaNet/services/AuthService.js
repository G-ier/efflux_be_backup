// Local application imports
const EnvironmentVariablesManager     = require("../../../src/shared/services/EnvironmentVariablesManager");
const { MEDIANET_API_URL }            = require("../constants");
const { MediaNetLogger }              = require("../../../src/shared/lib/WinstonLogger");

const axios = require("axios");

class AuthService{

    constructor(){
        this.logger = MediaNetLogger;
        this.token = null;
        this.expires_in = null;
    }

    async authenticate(){

        this.logger.info("Fetching access token from API");

        const params = {
            user_email: EnvironmentVariablesManager.getEnvVariable('MEDIANET_EMAIL'),
            password: EnvironmentVariablesManager.getEnvVariable('MEDIANET_PASSWORD')
        }
        const res = await axios.post(MEDIANET_API_URL, params);
        this.token = res.data.data.token;

        const currentTimeInMilliseconds = new Date().getTime();
        // // Calculate the expiration time in milliseconds
        const expirationTimeInMilliseconds = currentTimeInMilliseconds + res.data.data.expires_in * 1000;
        // Create a Date object for the expiration time
        this.expires_in = new Date(expirationTimeInMilliseconds);

        this.logger.info("DONE Fetching access token from API");
    }

    async getAccessToken(){

        this.logger.info("Checking if token is still valid.");
        if (!this.token || this.expires_in < Date.now()) {
            await this.authenticate();
        }
        else{
            this.logger.info("Using available stored token");
        }

        return this.token;
    }
}

module.exports = AuthService
