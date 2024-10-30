
async function excludeAdAccountQuery(database, ad_account_id, ad_account_provider_id, traffic_source, name, mediaBuyer) {


  const query = `INSERT INTO excluded_ad_accounts (ad_account_id, ad_account_provider_id, traffic_source, name) VALUES (${ad_account_id}, '${ad_account_provider_id}', '${traffic_source}', '${name}');`;

  const { rows } = await database.raw(query);

  // Reset AUTO_INCREMENT
  // const reset_query = `SELECT setval('id_seq', (SELECT MAX(id) FROM excluded_ad_accounts));`;
  //await database.raw(reset_query);

  return rows;
}

module.exports = excludeAdAccountQuery;
