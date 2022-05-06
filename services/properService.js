const _ = require('lodash');
const db = require('../data/dbConfig');

async function add(data, adsetIds) {
  const existedPropers = await db.select('*').from('proper').whereIn('adset_id', adsetIds);

  const existedPropersMap = _.keyBy(existedPropers, ({adset_id, hour, date}) => {
    return `${adset_id}||${date} ${hour}`;
  });

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(data, item => {
    const existedProper = existedPropersMap[`${item.adset_id}||${item.date} ${item.hour}`];
    if (!existedProper) return 'createArr';
    if (existedProper) {
      if (existedProper.revenue !== item.revenue ||
        existedProper.visitors !== item.visitors
      ) return 'updateArr';
      return 'skipArr';
    }
  });

  let result = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  if (createArr.length) {
    const created = await db('proper').insert(createArr);
    result.created = created.rowCount;
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db('proper')
          .where({adset_id: item.adset_id, date: item.date, hour: item.hour}).first()
          .update({
            revenue: item.revenue,
            visitors: item.visitors,
          }).returning('id')
      })
    );
    result.updated = updated.length;
  }

  result.skipped = skipArr.length;

  console.log(`ADDED ${result.created} ROWS FROM PROPER`);
  console.log(`UPDATED ${result.updated} ROWS FROM PROPER`);
  console.log(`SKIPPED ${result.skipped} ROWS FROM PROPER`);

  return result;
}

module.exports = {
  add,
};
