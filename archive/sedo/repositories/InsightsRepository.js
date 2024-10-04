// Third party imports
const _ = require('lodash');

// Local application imports
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const Insights = require('../entities/Insights');
const interpretDataWTemplateV1 = require('../templates/v1');
const interpretDataWTemplateV2 = require('../templates/v2');
const SqsService = require('../../../shared/lib/SQSPusher');

class InsightsRepository {
  // We might need to do some processing on the data, aggregate it, etc.

  constructor() {
    this.tablename = 'sedo';
    this.database = new DatabaseRepository();
  }

  async update(data, criteria) {
    await this.database.update(this.tablename, data, criteria);
  }

  async delete(criteria) {
    await this.database.delete(this.tablename, criteria);
  }

  aggregateByUniqueIdentifier(dataList) {
    // Group by unique_identifier
    const groupedData = _.groupBy(dataList, 'unique_identifier');

    // Reduce each group by merging them together
    const mergedData = _.map(groupedData, (group) => {
      return group.reduce((acc, current) => {
        Object.keys(current).forEach((key) => {
          if (key === 'hour') {
            acc[key] = current[key]; // keep the hour value from the last item in the group
          } else if (_.isNumber(current[key])) {
            acc[key] = (acc[key] || 0) + current[key];
          } else {
            acc[key] = current[key]; // for other non-numeric fields
          }
        });
        return acc;
      }, {});
    });

    return mergedData;
  }

  processSedoInsights(insights, date) {
    const databaseDTOInsights = insights.map((insight) => this.parseSedoAPIData(insight, date));
    const aggregatedInsights = this.aggregateByUniqueIdentifier(databaseDTOInsights);
    return aggregatedInsights;
  }

  async upsert(insights, chunkSize = 500) {
    const dataChunks = _.chunk(insights, chunkSize);
    for (const chunk of dataChunks) {
      await this.database.upsert(this.tablename, chunk, 'unique_identifier');
    }
  }

  async fetchInsights(fields = ['*'], filters = {}, limit) {
    const cache = true;
    // If not in cache, fetch from the database
    const results = await this.database.query(this.tablename, fields, filters, limit, [], cache);
    return results;
  }

  parseSedoAPIData(insight, date) {
    const templateInterpretation =
      insight.c3[0]?._ && insight.c3[0]?._.startsWith('temp_v2_')
        ? interpretDataWTemplateV2
        : interpretDataWTemplateV1;
    return templateInterpretation(insight, date);
  }

  toDomainEntity(dbObject) {
    throw new Error('Not implemented. Please implement this method after creating the table!');
    return new Insights(dbObject);
  }
}

module.exports = InsightsRepository;
