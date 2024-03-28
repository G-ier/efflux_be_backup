const SherlockRepository = require('../repositories/SherlockRepository');
const { SherlockLogger } = require('../../../shared/lib/WinstonLogger');

class SherlockService {
  constructor() {
    this.sherlockRepository = new SherlockRepository();
  }

  async paramConvertWrapper(callback, params) {
    const { startDate, endDate, orgId } = params;
    if (!startDate || !endDate) {
      throw new Error(
        'Missing date parameters, please provide startDate and endDate in url pattern',
      );
    }

    const pattern = /^(?:\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?)$/;
    if (!pattern.test(startDate) || !pattern.test(endDate)) {
      throw new Error('Invalid date format');
    }

    const finalParams = {
      startDate: startDate,
      endDate: endDate,
      orgId,
    };
    try {
      return await callback(finalParams);
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }
  }

  async generateFindingsDaily(startDate, endDate, orgId) {
    return await this.paramConvertWrapper(
      (...args) => this.sherlockRepository.findingsDaily(...args),
      { startDate, endDate, orgId },
    );
  }
}

module.exports = SherlockService;
