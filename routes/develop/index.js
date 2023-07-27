const route = require("express").Router();

route.get("/", async (req, res) => {

  res.status(200).send({ message: "Here we develop routes" });

});

module.exports = route;
