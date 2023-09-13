const route = require('express').Router();
const {addProperData} = require('../../controllers/properController');

route.post('/', async (req, res) => {
  try {
    await addProperData(req.body.attachment.data);
    res.status(200);
  } catch (err) {
    console.log(err.message);
    res.status(500).json(err.message);
  }
});

module.exports = route;
