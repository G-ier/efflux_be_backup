const _ = require("lodash");
const db = require("../data/dbConfig");

const LIMIT = 30;

async function updateCampaigns(campaigns, provider) {
  const fields = ["id", "status", "daily_budget", "budget_remaining", "lifetime_budget", "name"];
  const existedCampaigns = await db.select(fields)
    .from("campaigns")
    .where({traffic_source: provider});
  const existedCampaignsMap = _.keyBy(existedCampaigns, "id");

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(campaigns, campaign => {
    const existedCampaign = existedCampaignsMap[campaign.id];
    if (!existedCampaign) return "createArr";
    if (existedCampaign) {
      if (existedCampaign.status !== campaign.status ||
        existedCampaign.daily_budget !== campaign.daily_budget ||
        existedCampaign.budget_remaining !== campaign.budget_remaining ||
        existedCampaign.lifetime_budget !== campaign.lifetime_budget ||
        existedCampaign.name !== campaign.name
      ) return "updateArr";
      return "skipArr";
    }
  });

  let result = [];

  if (createArr.length) {
    const created = await db("campaigns").insert(createArr).returning(fields);
    console.log('CREATED CAMPAIGNS LENGTH', created.length)
    result.push(...created);
  }


  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => db("campaigns")
        .where("id", item.id).first()
        .update(item).returning(fields))
    );
    console.log('UPDATED CAMPAIGNS LENGTH', updated.length)
    result.push(...updated);
  }

  console.log('SKIPPED CAMPAIGNS LENGTH', skipArr.length)
  result.push(...skipArr);
  return result;
}

async function get(limit = LIMIT, page = 1, orderBy = "updated_time", order = "descend") {
  const fields = ["id", "name", "status", "traffic_source", "network", "created_time", "updated_time"];
  const [data, total] = await Promise.all([
    db.select(...fields).from("campaigns").limit(limit).offset(limit * page).orderBy(orderBy, order),
    db("campaigns").count().first()
  ]);
  return {data, total: total.count};
}

async function deleteById(id) {
  const count = await db("campaigns").where("id", id).first().del();
  return count;
}

async function update(filter, updateData) {
  const count = await db("campaigns").where(filter).update(updateData);
  return count;
}

async function getCampaignNames(ids) {
  const data = await db.select("id", "name").from("campaigns")
    .whereIn("id", ids);
  return _.keyBy(data, "id");
}

module.exports = {
  updateCampaigns,
  deleteById,
  get,
  update,
  getCampaignNames,
};
