const route = require('express').Router();
const usersController = require('../../controllers/usersController');
const adAccountsController = require('../../controllers/adAccountsController');
const pixelsController = require('../../controllers/pixelsController');
const wrap = require('../../utils/wrap')

route.get('/',
  wrap(async (req, res) => {
    const isAdmin = req.user.permissions.includes('admin');
    const users = await usersController.getUsers(isAdmin);
    return res.status(200).json(users);
  }),
);

// Find the ad accounts belonging to a user and return them.
route.get('/adAccounts',
  wrap(async (req, res) => {
    console.log('req.user', req.user)
    console.log('req.query', req.query)
    const {networks} = req.query;
    const adAccounts = await adAccountsController.getAdAccounts(req.user, networks);
    res.json(adAccounts);
  }),
);

route.post('/adAccounts',
  wrap(async (req, res) => {
    console.log('req.body', req.body)
    console.log('req.user', req.user)
    const {id, updateData} = req.body;
    console.log('updateData', updateData, 'id', id, 'req.user', req.user)
    const {name, count} = await adAccountsController.updateAdAccount(req.user, {id}, updateData);
    res.json({message: `AdAccount ${name} was updated. Updated campaigns count: ${count}`});
  }),
);

route.get('/pixels',
  wrap(async (req, res) => {
    const pixels = await pixelsController.getPixels({column: "created_at", order: "DESC"});
    res.json(pixels);
  }),
);

route.get('/pixels/:id',
  wrap(async (req, res) => {
    const {id} = req.params
    const pixels = await pixelsController.getPixel(id);
    res.json(pixels);
  }),
);

route.post('/pixels',
  wrap(async (req, res) => {
    const {data} = req.body;
    const pixel = await pixelsController.addPixel(data);
    res.json({message: `Pixel ${pixel} was updated.`});
  }),
);

route.post('/pixels/:id',
  wrap(async (req, res) => {
    const {id} = req.params
    const {updateData} = req.body;
    const pixel = await pixelsController.updatePixel(id, updateData);
    res.json({message: `Pixel ${pixel} was updated.`});
  }),
);

route.delete('/pixels/:id',
  wrap(async (req, res) => {
    const {id} = req.params
    const deleted = await pixelsController.deletePixel(id);
    res.json(deleted);
  }),
);

module.exports = route;
