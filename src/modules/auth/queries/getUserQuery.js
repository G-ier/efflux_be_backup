
async function getUserQuery(database, mediaBuyerID) {


  const query = `SELECT * FROM users WHERE id=${mediaBuyerID};`;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = getUserQuery;
