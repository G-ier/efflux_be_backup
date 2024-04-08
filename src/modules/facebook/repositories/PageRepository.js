const _ = require("lodash");
const Page = require("../entities/Page");
const DatabaseRepository = require("../../../shared/lib/DatabaseRepository");

class PageRepository{
    constructor(database) {
        this.tableName = "pages";
        this.database = database || new DatabaseRepository();
    }

    async saveOne(page) {
        const dbObject = this.toDatabaseDTO(page);
        return await this.database.insert(this.tableName, dbObject);
    }

    async updateOne(page, criteria) {
        const dbObject = this.toDatabaseDTO(page);
        return await this.database.update(this.tableName, dbObject, criteria);
    }

    async saveInBulk(pages, chunkSize = 500) {
        let data = pages.map((page) => toDatabaseDTO(page));
        let dataChunks = _.chunk(data, chunkSize);
        for (let chunk of dataChunks) {
          await this.database.insert(this.tableName, chunk);
        }
    }

    async upsert(pages, chunkSize = 500) {

        const dbObjects = pages.map((page) => this.toDatabaseDTO(page));

        const dataChunks = _.chunk(dbObjects, chunkSize);
        for (const chunk of dataChunks) {
          await this.database.upsert(this.tableName, chunk, "unique_identifier");
        }
    }

    async fetchPages(fields = ["*"], filters = {}, limit, joins = []) {
        const results = await this.database.query(this.tableName, fields, filters, limit, joins);
        return results;
    }

    toDatabaseDTO(page) {
        return {
            id: page.id,
            name: page.name,
            account_id: page.account_id,
            user_id: page.efflux_user_id,
            unique_identifier: `${page.id}_${page.account_id}`
        };
    }

    toDomainEntity(dbObject) {

        return new Page(
            dbObject.id,
            dbObject.name
        );
    }
}

module.exports = PageRepository;
