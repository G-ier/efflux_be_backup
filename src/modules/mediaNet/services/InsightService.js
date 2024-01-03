const { MediaNetLogger }             = require("../../../shared/lib/WinstonLogger");
const AuthService                    = require("./AuthService");
const InsightRepository              = require("../repositories/InsightRepository");
const BaseService = require("../../../shared/services/BaseService");

const axios = require("axios");


class InsightService extends BaseService{
    constructor(){
        super(MediaNetLogger);
        this.authService = new AuthService();
        this.insightRepository = new InsightRepository();
    }

    async fetchInsightsFromApi(startDate, endDate){

        this.logger.info(`Fetching MediaNet insights from API for ${startDate} - ${endDate}`);

        const url = `https://api-pubconsole.media.net/v2/reports`;
        const headers = {
            'token': await this.authService.getAccessToken(),
            'Content-Type': 'application/json'
        }
        const params = {
            start_date: startDate,
            end_date: endDate,
            group_by: [ "channel", "channel_name2", "channel_name3" ],
        }

        try {
            const res = await axios.post(url, params, { headers });
            console.log(res.data);
            this.logger.info(`Fetched ${res.data.data.rows.length}  MediaNet Insights from the API`);

            return res.data.data.rows;
        } catch (error) {
            console.error(error.response.status); // Log the HTTP status code for debugging
            console.error(error.response.data);   // Log the response data for debugging
            // Handle the error as needed
        }

    }

    async syncInsights(startDate, endDate){
        this.logger.info('Syncing MediaNet Insights');
        const insights = await this.fetchInsightsFromApi(startDate, endDate);
        console.log(insights);

        await this.executeWithLogging(
          () => this.insightRepository.upsert(insights),
          "Error processing and upserting bulk data"
        );
        this.logger.info('MediaNet Insights synced successfully');
        return insights.length;
    }

    async testSync(insight){
        await this.insightRepository.upsert(insight);
    }
}

module.exports = InsightService;
