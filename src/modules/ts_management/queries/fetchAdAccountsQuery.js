
async function fetchAdAccountsQuery(database) {


  const query = `SELECT * FROM ad_accounts;`;

  const { rows } = await database.raw(query);

  // Reset AUTO_INCREMENTa
  // const reset_query = `SELECT setval('id_seq', (SELECT MAX(id) FROM excluded_ad_accounts));`;
  //await database.raw(reset_query);

  return rows;
}

module.exports = fetchAdAccountsQuery;
