const _ = require('lodash');
const AdCard = require('../entities/AdCard');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');


class AdCardsRepository {

  constructor(database) {
    this.tableName = "ad_cards";
    this.database = database || new DatabaseRepository();
  }

  async saveOne(adCard, trx = null) {
      const dbObject = this.toDatabaseDTO(adCard);
      return await this.database.insert(this.tableName, dbObject, trx);
  }


  async updateOne(adCard, adCardId) {
    const dbObject = this.toDatabaseDTO(adCard);
    return await this.database.update(this.tableName, dbObject, {id: adCardId});
  }

  async fetchAdCards(fields = ['*'], filters = {}, limit) {
    const results = await this.database.query(this.tableName, fields, filters, limit);
    return results;
  }

  async deleteById(adCardId) {
    return await this.database.delete(this.tableName, {
      id: adCardId
    });
  }

  toDatabaseDTO(adCard) {
    return {
      head_line: adCard.head_line,
      description: adCard.description,
      ad_id: adCard.ad_id,
    }
  }

  toDomainEntity(dbObject) {
    return new AdCard(
      dbObject.id,
      dbObject.head_line,
      dbObject.description,
      dbObject.ad_id,
    );
  }

}

module.exports = AdCardsRepository;
