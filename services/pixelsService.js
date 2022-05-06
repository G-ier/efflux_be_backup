const db = require("../data/dbConfig");
const _ = require("lodash");

async function getAll(orderBy, fields = ["*"]) {
  const pixels = await db.select("fb_pixels." + fields, {token: "fb_pixels.token", name: "fb_pixels.name", account_email: "user_accounts.email" })
    .from("fb_pixels")
    .leftOuterJoin("user_accounts", "fb_pixels.account_id", "user_accounts.id",)
    .orderBy("fb_pixels." + orderBy.column, orderBy.order);

  return pixels;
}

async function getOne(pixel_id, fields = ["*"]) {
  return db.select(...fields).from("fb_pixels").where({ pixel_id }).first();
}

async function add(pixelData, fields = ["*"]) {
  const newPixel = await db("fb_pixels").insert(pixelData).returning(...fields);
  return newPixel;
}

async function update(pixel_id, updateData, fields = ["*"]) {
  const updated = await db("fb_pixels").where({ pixel_id }).first().update(updateData).returning(...fields);
  return updated;
}

async function deleteOne(pixel_id) {
  const deleted = await db("fb_pixels").where({ pixel_id }).del();
  return deleted
}

async function updatePixels(pixels, pixelIds) {
  const fields = ["pixel_id", "name", "business_name", "is_unavailable", "last_fired_time", "data_use_setting"];
  const existedPixels = await db.select(...fields)
    .from("fb_pixels")
    .whereIn("pixel_id", pixelIds);
  const existedPixelsMap = _.keyBy(existedPixels, "pixel_id");

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(pixels, pixel => {
    const existedPixel = existedPixelsMap[pixel.pixel_id];
    if (!existedPixel) return "createArr";
    if (existedPixel) {
      if (existedPixel.name !== pixel.name ||
        existedPixel.business_name !== pixel.business_name ||
        existedPixel.is_unavailable !== pixel.is_unavailable ||
        existedPixel.lifetime_budget !== pixel.lifetime_budget ||
        existedPixel.last_fired_time !== pixel.last_fired_time ||
        existedPixel.data_use_setting !== pixel.data_use_setting
      ) return "updateArr";
      return "skipArr";
    }
  });

  let result = [];

  if (createArr.length) {
    const created = await add(createArr, fields)
    console.log('CREATED PIXELS LENGTH', created.length)
    result.push(...created);
  }


  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => update(item.pixel_id, {
        name: item.name,
        business_name: item.business_name,
        is_unavailable: item.is_unavailable,
        last_fired_time: item.last_fired_time,
        data_use_setting: item.data_use_setting,
        lifetime_budget: item.lifetime_budget,
      }, fields))
    );
    console.log('UPDATED PIXELS LENGTH', updated.length)
    result.push(...updated);
  }

  console.log('SKIPPED PIXELS LENGTH', skipArr.length)
  result.push(...skipArr);
  return result;
}

module.exports = {
  getAll,
  getOne,
  add,
  update,
  deleteOne,
  updatePixels,
};
