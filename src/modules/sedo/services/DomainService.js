
// Third party imports
const xml2js = require("xml2js");
const _ = require("lodash");

// Local application imports
const { SedoLogger } = require("../../../shared/lib/WinstonLogger");
const BaseService = require("../../../shared/services/BaseService");
const { SEDO_API_URL } = require("../constants");
const EnvironmentVariablesManager = require("../../../shared/services/EnvironmentVariablesManager");


class DomainService extends BaseService {
    constructor() {
        super(SedoLogger);
    }

    async insertDomainIntoSedo(domain)
    {
      this.logger.info(`Insert domain into sedo API`);
        const baseUrl = `${SEDO_API_URL}DomainInsert`;
        const params = {
            partnerid: EnvironmentVariablesManager.getEnvVariable("SEDO_PARTNERID"),
            signkey: EnvironmentVariablesManager.getEnvVariable("SEDO_SIGNKEY"),
            username: EnvironmentVariablesManager.getEnvVariable("SEDO_USERNAME"),
            password: EnvironmentVariablesManager.getEnvVariable("SEDO_PASSWORD"),
            output_method: "xml",
        }


    const queryParams = new URLSearchParams(params).toString();
    const domainEntries = this.arrayToQueryString(domain)
    const url = `${baseUrl}?${queryParams}&${domainEntries}`;
        const response = await this.fetchFromApi(url, {});

        const parserOptions = {
          ignoreAttrs: true,
          explicitArray: false,
          valueProcessors: [xml2js.processors.parseNumbers]
        }
      const parsedXMLBody = await xml2js.parseStringPromise(response, parserOptions);

      if (parsedXMLBody.SEDOLIST.item.status != "ok") {
          this.logger.error(
            `error : ${parsedXMLBody.SEDOLIST.item.message}`
          );
          throw new Error(
            `Error : ${parsedXMLBody.SEDOLIST.item.message}`
          );
      }else{
        this.logger.info(`Domain inserted into Sedo`);
      }

    }

    arrayToQueryString(domainEntries) {
      const params = [];
      const defaultValues = {
        domain: '',
        category: [],
        forsale: 0,
        price: 0,
        minprice: 0,
        fixedprice: 0,
        currency: 0,
        domainlanguage: 'en'
    };
  
    domainEntries.forEach((entry, outerIndex) => {
      const validatedEntry = {
          ...defaultValues,
          ...entry 
      };

      for (const key in validatedEntry) {
          if (key === "domain") {
              params.push(`domainentry[${outerIndex}][${key}]=${encodeURIComponent(validatedEntry[key])}`);
          } else {
              params.push(`domainentry[${outerIndex}][${key}]=${encodeURIComponent(validatedEntry[key])}`);
          }
      }
  });
  
      return params.join('&');
  }
}

module.exports = DomainService;
