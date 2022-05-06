const db = require("../data/dbConfig");

const get = (tbl) => db(tbl);

const findBy = (tbl, filter) => db(tbl).where(filter).first();

const findAllBy = (tbl, filter) => db(tbl).where(filter);

const add = (tbl, item) => db(tbl).insert(item).returning("id");

const remove = (tbl, id) => db(tbl).where({ id }).del();

const removeItems = (date, table) =>
  db.raw(`DELETE FROM ${table} WHERE date = '${date}' `);

const update = (tbl, id, item) => db(tbl).where({ id }).update(item);

const removeAllOnDate = (tbl, date) => {
  return db.raw(`
      delete from ${tbl}
      where date = '${date}'
  `);
};

const removeByDateHour = (table, date, hour) => {
  return db.raw(`
    delete from ${table}
    where date = '${date}' and hour = '${hour}'
  `)
}

module.exports = {
  get,
  findBy,
  findAllBy,
  add,
  remove,
  removeItems,
  update,
  removeAllOnDate,
  removeByDateHour,
}
