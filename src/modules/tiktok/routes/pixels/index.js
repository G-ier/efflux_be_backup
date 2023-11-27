const route = require("express").Router();
const PixelsController = require("../../controllers/PixelsController");
const pixelsController = new PixelsController();

// @route    GET /api/facebook/pixels
// @desc     Fetch pixels
// @Access   Private
route.get('/', async (req, res) => await pixelsController.fetchPixels(req, res));

// @route    GET /api/facebook/pixels/:id
// @desc     Fetch pixels by id
// @Access   Private
route.get('/:id', async (req, res) => await pixelsController.fetchPixelById(req, res));

// @route    POST /api/facebook/pixels
// @desc     Add a new pixel
// @Access   Private
route.post('/', async (req, res) => await pixelsController.addPixel(req, res));

// @route    POST /api/facebook/pixels/:id
// @desc     Update a pixel
// @Access   Private
route.post('/:id', async (req, res) => await pixelsController.updatePixel(req, res));

// @route    DELETE /api/facebook/pixels/:id
// @desc     Delete a pixel
// @Access   Private
route.delete('/:id', async (req, res) => await pixelsController.deletePixel(req, res));


module.exports = route;
