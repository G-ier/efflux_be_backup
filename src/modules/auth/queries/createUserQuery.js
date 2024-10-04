
async function createUserQuery(database, userCreationResponseData, rights, password, username) {

  const separatedParts = userCreationResponseData.user_id.split('|');

  const query = `
      INSERT INTO users (
        name,
        email,
        image_url,
        nickname,
        sub,
        acct_type,
        phone,
        token,
        "fbID",
        provider,
        "providerId",
        org_id,
        role_id
      )
      VALUES (
        '${userCreationResponseData.name}',
        '${userCreationResponseData.email}',
        NULL,
        '${username}',
        '${userCreationResponseData.user_id}',
        '${rights}',
        NULL,
        '${password}',
        NULL,
        'auth0',
        '${separatedParts[1]}',
        1,
        ${rights == "admin" ? 9 : 10}
      );
    `;

  const { rows } = await database.raw(query);
  return rows;
}

module.exports = createUserQuery;
