const route = require("express").Router();
const { createAuth0User } = require("../../services/oauthService");

route.post("/users", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: `Missing required fields` });
  } else {
    const { status, data } = await createAuth0User({ email, password }).catch(e => e.response );
    res.status(status).json(data);
  }
});

module.exports = route;

