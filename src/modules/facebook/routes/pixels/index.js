const route = require('express').Router();
const PixelsController = require('../../controllers/PixelsController');
const pixelsController = new PixelsController();
const CompositeController = require("../../controllers/CompositeController");
const compositeController = new CompositeController();
const checkPermission = require('../../../../../middleware/checkPermissions');

// @route    GET /api/facebook/pixels/refresh
// @desc     Refresh pixels
// @Access   Private
route.get('/refresh', async (req, res) => {
  await compositeController.syncPixels(req, res);
});

// @route    GET /api/facebook/pixels
// @desc     Fetch pixels
// @Access   Private
route.get(
  '/',
  checkPermission(['read_pixels']),
  async (req, res) => await pixelsController.fetchPixels(req, res),
);

// @route    GET /api/facebook/pixels/:id
// @desc     Fetch pixels by id
// @Access   Private
route.get('/:id', checkPermission(['read_pixels']), async (req, res) => {
  await pixelsController.fetchPixelById(req, res);
});

// @route    POST /api/facebook/pixels
// @desc     Add a new pixel
// @Access   Private
route.post('/', checkPermission(['create_pixels']), async (req, res) => {
  await pixelsController.createPixel(req, res);
});

// @route    POST /api/facebook/pixels/:id
// @desc     Update a pixel
// @Access   Private
route.post('/:id', checkPermission(['edit_pixels']), async (req, res) => {
  await pixelsController.updatePixel(req, res);
});

// @route    DELETE /api/facebook/pixels/:id
// @desc     Delete a pixel
// @Access   Private
route.delete('/:id', checkPermission(['delete_pixels']), async (req, res) => {
  await pixelsController.deletePixel(req, res);
});

module.exports = route;
