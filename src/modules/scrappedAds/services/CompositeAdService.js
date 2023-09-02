// Third party imports
const {} = require("http-errors");

// Local application imports
const AdCardsRepository = require('../repositories/AdCardsRepository');
const CreativesRepository = require('../repositories/CreativesRepository');
const ScrappedAdsRepository = require('../repositories/ScrappedAdsRepository');
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class CompositeAdService {

  constructor() {
    this.adCardsRepository = new AdCardsRepository();
    this.creativesRepository = new CreativesRepository();
    this.scrappedAdsRepository = new ScrappedAdsRepository();
    this.database = new DatabaseRepository();
  }

  async createCompositeAd(adCard, creative, scrappedAd) {
    return await this.database.connection.transaction(async (trx) => {
      try {
        const scrappedAdResult = await this.scrappedAdsRepository.saveOne(scrappedAd, trx);
        if (!scrappedAdResult) {
          throw new Error('Could not save scrapped ad');
        }
        adCard.ad_id = scrappedAdResult[0];
        const adCardResult = await this.adCardsRepository.saveOne(adCard, trx);
        if (!adCardResult) {
          throw new Error('Could not save ad card');
        }
        creative.ad_card_id = adCardResult[0];
        const creativeResult = await this.creativesRepository.saveOne(creative, trx);
        if (!creativeResult) {
          throw new Error('Could not save creative');
        }
        return {
          adCard: adCardResult,
          creative: creativeResult,
          scrappedAd: scrappedAdResult,
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  }

  async updateCompositeAd(data, id) {
    return await this.database.connection.transaction(async (trx) => {
      try {
        const scrappedAdResult = await this.scrappedAdsRepository.updateOne(data.scrappedAd, id);
        if (!scrappedAdResult) {
          throw new Error('Could not update scrapped ad');
        }
        const adCardResult = await this.adCardsRepository.updateOne(data.adCard, scrappedAdResult.ad_id);
        if (!adCardResult) {
          throw new Error('Could not update ad card');
        }
        const creativeResult = await this.creativesRepository.updateOne(data.creative, adCardResult.ad_id);
        if (!creativeResult) {
          throw new Error('Could not update creative');
        }
        return {
          adCard: adCardResult,
          creative: creativeResult,
          scrappedAd: scrappedAdResult,
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  }

  async getCompositeAd(fields, filters, limit) {
    return await this.database.connection.transaction(async (trx) => {
      try {
        const scrappedAdResult = await this.scrappedAdsRepository.fetchScrappedAds(fields, filters, limit);
        if (!scrappedAdResult) {
          throw new Error('Could not fetch scrapped ad');
        }
        const adCardResult = await this.adCardsRepository.fetchAdCards(fields, filters, limit);
        if (!adCardResult) {
          throw new Error('Could not fetch ad card');
        }
        const creativeResult = await this.creativesRepository.fetchCreatives(fields, filters, limit);
        if (!creativeResult) {
          throw new Error('Could not fetch creative');
        }
        return {
          adCard: adCardResult,
          creative: creativeResult,
          scrappedAd: scrappedAdResult,
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  }

  async deleteCompositeAd(scrappedAdId) {
    return await this.database.connection.transaction(async (trx) => {
      try {
        const adCardId = await this.adCardsRepository.fetchAdCards(['id'], {ad_id: scrappedAdId}, 1);
        const { id } = adCardId[0];

        const creativeIObj = await this.creativesRepository.fetchCreatives(['id'], {ad_card_id: id}, 1);
        const { id: creativeId } = creativeIObj[0];

        const creativeResult = await this.creativesRepository.deleteById(creativeId, trx);
        if (!creativeResult) {
          throw new Error('Could not delete creative');
        }

        const adCardResult = await this.adCardsRepository.deleteById(id, trx);
        if (!adCardResult) {
          throw new Error('Could not delete ad card');
        }

        const scrappedAdResult = await this.scrappedAdsRepository.deleteById(scrappedAdId, trx);
        if (!scrappedAdResult) {
          throw new Error('Could not delete scrapped ad');
        }
        return {
          adCard: adCardResult,
          creative: creativeResult,
          scrappedAd: scrappedAdResult,
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  }
}

module.exports = CompositeAdService;
