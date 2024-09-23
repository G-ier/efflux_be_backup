
async function deleteUserQuery(database, id) {


  const query = `DELETE FROM users WHERE id = ${id};`;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = deleteUserQuery;
