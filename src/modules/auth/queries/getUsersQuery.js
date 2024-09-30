
async function getUsersQuery(database) {


  const query = `SELECT * FROM users;`;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = getUsersQuery;
