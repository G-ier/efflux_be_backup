
async function deleteUserQuery(database, id) {


  const query = `DELETE FROM users WHERE id = ${id};`;

  const { rows } = await database.raw(query);

  // Reset AUTO_INCREMENT
  const reset_query = `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`;
  await database.raw(reset_query);

  return rows;
}

module.exports = deleteUserQuery;
