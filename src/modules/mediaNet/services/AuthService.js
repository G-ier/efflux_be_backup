const { MediaNetLogger }             = require("../../../shared/lib/WinstonLogger");

const axios = require("axios");

class AuthService{

    constructor(){
        this.logger = MediaNetLogger;
        this.token = null;
        this.expires_in = null;
    }

    async authenticate(){
        // p@roi.ad / HGbif34t34g!!

        this.logger.info("Fetching access token from API");

        const url = `https://api-pubconsole.media.net/v2/login`;
        const params = {
            user_email: 'p@roi.ad',
            password: 'HGbif34t34g!!'
        }
        // const res = await axios.post(url, params);
        //Token:  eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3B1YmNvbnNvbGUubWVkaWEubmV0Iiwic3ViIjoiOENVVTg0QjZIIiwiaWF0IjoxNzAzODU0OTY2LCJleHAiOjE3MDM5NDEzNjYsImF1ZCI6W119.jmdE11sEh05KKUrFzuEhnoKF9qum4vhEQ6e3zzfIKgHainjtTxjaGmebvlkJETGI-pm_jKQ6GgwuL7sGZl6mnkM6kGdMIEDSzZO02ps5aN4Re3kjILtuNBICDqBiARuZu9tGP2l8yObGPk1VGJ8qaHaexzbA-j8YRjP3zUic4nELSz02uzdgeZ6eVih_cTjdELElP3I7zJmw7-_W3A3UsFJYFg-FXk5-BVjwuKmx7ux07A4lpH2_LNHpNwypEq7iwawFTOrPfTp4u2ctw1JJDkeFiN7LuYpKnnqYdw0mIPk6DIMVaw-wrU-wUuS1wytAtWvRM6vz-GsZbPp3sRO7weNcqWsHO8CHXz89sq7DBsBy_ANIe-rxG5cpU7yT7kEOgc-r3vGQJTa_z5_VeeAUzF8N0g4RvE4RnNR9hUA_69VlaNo3PVzCD2CRz7uGCVzVtxJvoxVLHDwCQpC-x_6uXLZZMyUKQjQLl-ItjlrE33viLwkjK8KImtI43QEnoxtyb1YE1c3Si01yDUP6lLR2ZlSQ2YrdRnpFmA_jcFtV4ZfETkx9xXkQUo7b1z9-IyPBUAiRD0MuCkJhe2LT6iUI9nKSqg5MYjrekfHxsG3y-uQ0SLMQXrr_1_DEwQh94qj1TbTeN9Vr4Kvy6kpk2VvdLLUEMaMREoxXtxL2eiLmX74 

        //Expires in:  2023-12-30T13:02:45.696Z

        this.token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3B1YmNvbnNvbGUubWVkaWEubmV0Iiwic3ViIjoiOENVVTg0QjZIIiwiaWF0IjoxNzAzODU0OTY2LCJleHAiOjE3MDM5NDEzNjYsImF1ZCI6W119.jmdE11sEh05KKUrFzuEhnoKF9qum4vhEQ6e3zzfIKgHainjtTxjaGmebvlkJETGI-pm_jKQ6GgwuL7sGZl6mnkM6kGdMIEDSzZO02ps5aN4Re3kjILtuNBICDqBiARuZu9tGP2l8yObGPk1VGJ8qaHaexzbA-j8YRjP3zUic4nELSz02uzdgeZ6eVih_cTjdELElP3I7zJmw7-_W3A3UsFJYFg-FXk5-BVjwuKmx7ux07A4lpH2_LNHpNwypEq7iwawFTOrPfTp4u2ctw1JJDkeFiN7LuYpKnnqYdw0mIPk6DIMVaw-wrU-wUuS1wytAtWvRM6vz-GsZbPp3sRO7weNcqWsHO8CHXz89sq7DBsBy_ANIe-rxG5cpU7yT7kEOgc-r3vGQJTa_z5_VeeAUzF8N0g4RvE4RnNR9hUA_69VlaNo3PVzCD2CRz7uGCVzVtxJvoxVLHDwCQpC-x_6uXLZZMyUKQjQLl-ItjlrE33viLwkjK8KImtI43QEnoxtyb1YE1c3Si01yDUP6lLR2ZlSQ2YrdRnpFmA_jcFtV4ZfETkx9xXkQUo7b1z9-IyPBUAiRD0MuCkJhe2LT6iUI9nKSqg5MYjrekfHxsG3y-uQ0SLMQXrr_1_DEwQh94qj1TbTeN9Vr4Kvy6kpk2VvdLLUEMaMREoxXtxL2eiLmX74";
        //res.data.data.token

        // const currentTimeInMilliseconds = new Date().getTime();
        // // Calculate the expiration time in milliseconds
        // const expirationTimeInMilliseconds = currentTimeInMilliseconds + res.data.data.expires_in * 1000;
        // Create a Date object for the expiration time
        this.expires_in = "2023-12-30T13:02:45.696Z"; // new Date(expirationTimeInMilliseconds);

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