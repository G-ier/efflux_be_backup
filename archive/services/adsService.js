const db = require("../data/dbConfig");
const _ = require("lodash");


async function updateTikTokAds(ads, provider) {
  const fields = ["id", "campaign_id", "ad_group_id", "provider_id", "status"];
  const exitedAds = await db.select(fields)
    .from("tiktok_ads")
    .where({traffic_source: provider});
  const exitedAdsMap = _.keyBy(exitedAds, "provider_id");

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(ads, ad => {
    const existedad = exitedAdsMap[ad.provider_id];
    if (!existedad) return "createArr";
    if (existedad) {
      if (existedad.id !== ad.id ||
        existedad.campaign_id !== ad.campaign_id ||
        existedad.ad_group_id !== ad.ad_group_id ||
        existedad.provider_id !== ad.provider_id ||
        existedad.status !== ad.status
      ) return "updateArr";
      return "skipArr";
    }
  });

  let result = [];

  if (createArr.length) {
    const created = await db("tiktok_ads").insert(createArr).returning(fields);
    console.log('CREATED ADS LENGTH', created.length)
    result.push(...created);
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db("tiktok_ads")
          .where("provider_id", item.provider_id).first()
          .update(item).returning(fields)
      }));
    console.log('UPDATED ADS LENGTH', updated.length)
    result.push(...updated);
  }

  console.log('SKIPPED ADS LENGTH', skipArr.length)
  result.push(...skipArr);
  return result;
}

module.exports = {
  updateTikTokAds
};
