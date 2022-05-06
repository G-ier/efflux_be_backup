const db = require("../data/dbConfig");
const _ = require("lodash");

async function updateAdsets(adsets, provider) {
  const fields = ["id", "provider_id", "status", "daily_budget", "budget_remaining", "lifetime_budget", "name"];
  const existedAdsets = await db.select(fields)
    .from("adsets")
    .where({traffic_source: provider});
  const existedAdsetsMap = _.keyBy(existedAdsets, "provider_id");

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(adsets, adset => {
    const existedAdset = existedAdsetsMap[adset.provider_id];
    if (!existedAdset) return "createArr";
    if (existedAdset) {
      if (existedAdset.status !== adset.status ||
        existedAdset.daily_budget !== adset.daily_budget ||
        existedAdset.budget_remaining !== adset.budget_remaining ||
        existedAdset.lifetime_budget !== adset.lifetime_budget ||
        existedAdset.name !== adset.name
      ) return "updateArr";
      return "skipArr";
    }
  });

  let result = [];

  if (createArr.length) {
    const created = await db("adsets").insert(createArr).returning(fields);
    console.log('CREATED ADSETS LENGTH', created.length)
    result.push(...created);
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db("adsets")
          .where("provider_id", item.provider_id).first()
          .update(item).returning(fields)
      }));
    console.log('UPDATED ADSETS LENGTH', updated.length)
    result.push(...updated);
  }

  console.log('SKIPPED ADSETS LENGTH', skipArr.length)
  result.push(...skipArr);
  return result;
}

module.exports = {
  updateAdsets
};
