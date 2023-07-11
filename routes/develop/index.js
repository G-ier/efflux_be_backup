const route = require("express").Router();

route.post("/", async (req, res) => {

  // Ideally these will be images in bulk
  res.status(200).send({ message: "Here we develop routes" });
});

module.exports = route;
