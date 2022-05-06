const db = require("../data/dbConfig");

const handleFBID = async (userId, userAlias) => {
  //I remember Hamza mentioned that atm we're using intiials
  //to identify accounts. We need some way to uniquely refer to the current
  //user in the database in the case where the fbID has NOT yet
  //been set. The parameter 'userAlias' refers to this, and I worked
  //on assumption that 'nickname' in the users table holds
  //these initials. Thankfully, if I'm wrong, it's easily changed and
  //most of the code should still be useful :) .
  const user = await db("users").where("fbID", "=", userId);
  if (user.length === 0) {
    await db("users").where("nickname", "=", userAlias).update({
      fbID: userId,
    });
    return;
  }
};

module.exports = {
  handleFBID,
};
