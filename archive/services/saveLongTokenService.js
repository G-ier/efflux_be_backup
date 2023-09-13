const db = require("../data/dbConfig");

const updateLongToken = async (userId, longToken) => {
  await db("users").where("fbID", "=", userId).returning("name").update({
    token: longToken,
  });
  //the following is for verification that the above works
  db("users")
    .where({ fbID: userId })
    .then((res) => console.log("result ", res))
    .catch((err) => console.log("err", err));
};

module.exports = {
  updateLongToken,
};
