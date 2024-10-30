
async function includeExcludedAdAccountQuery(database, id, ad_account_id, mediaBuyer) {


  const query = `DELETE FROM excluded_ad_accounts WHERE id='${id}';
`;

  const { rows } = await database.raw(query);

  // Reset AUTO_INCREMENT
  // const reset_query = `SELECT setval('id_seq', (SELECT MAX(id) FROM excluded_ad_accounts));`;
  //await database.raw(reset_query);

  return rows;
}

module.exports = includeExcludedAdAccountQuery;
