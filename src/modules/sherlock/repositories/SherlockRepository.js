// Third party imports
const _ = require('lodash');

// Local application imports

const findingsDaily = require('../reports/findingsDaily');

const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const { cleanData, formatDateToISO } = require('../utils');

class SherlockRepository {
  constructor(database) {
    this.tableName = 'insights';
    this.database = database || new DatabaseRepository();
  }

  async findingsDaily(params) {
    const { startDate, endDate, campaignId, orgId } = params;
    return await findingsDaily(this.database, startDate, endDate, campaignId, orgId);
  }
}

module.exports = SherlockRepository;
