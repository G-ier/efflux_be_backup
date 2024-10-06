async function editUserQuery(database, selectedUser, fullName, username, email, password, rights) {


  const query = `
      UPDATE users
      SET
          ${fullName ? `name = '${fullName}',`: ''}
          ${username ? `nickname = '${username}',`: ''}
          ${email ? `email = '${email}',`: ''}
          ${password ? `token = '${password}',`: ''}
          ${rights == 'admin' ? `acct_type='admin',`: ''}
          ${rights == 'media_buyer' ? `acct_type='media_buyer',`: ''}
          ${rights ? `role_id = ${rights == 'admin' ? 9 : 10},`: ''}
          ${(fullName || username || email || password || rights) ? `updated_at = NOW()`: ''}
      WHERE id = ${selectedUser};
    `;

    console.log(query);

  if((fullName || username || email || password || rights)){
    const { rows } = await database.raw(query);
    return rows;
  }

}

module.exports = editUserQuery;
