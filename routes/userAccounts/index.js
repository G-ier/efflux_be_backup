const route = require('express').Router();
const wrap = require("../../utils/wrap");
const models = require("../../common/models");

route.get('/',
  wrap(async (req, res) => {
    const users = await models.findAllBy('user_accounts', {user_id: req.user.id})
    return res.status(200).json(users);
  }),
);

module.exports = route;
