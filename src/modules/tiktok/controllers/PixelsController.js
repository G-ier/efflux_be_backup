// Local application imports
const PixelsService = require('../services/PixelsService');

class PixelsController {

  constructor() {
    this.pixelService = new PixelsService();
  }

  async fetchPixels(req, res) {
    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = JSON.parse(fields);
      if (filters) filters = JSON.parse(filters);
      const pixels = await this.pixelService.fetchPixelsFromDatabase(fields, filters, limit);
      res.status(200).status(200).json(pixels);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }

  async fetchPixelById(req, res) {
    try {
      const { id } = req.params;
      const pixel = await this.pixelService.fetchPixelsFromDatabase(['*'], { pixel_id: id }); // maybe it should be id.
      res.status(200).json(pixel);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }

  async addPixel(req, res) {
    try {
      const { data } = req.body;
      const pixelId = await this.pixelService.savePixelInDatabase(data);
      res.status(200).json(pixelId);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }

  async updatePixel(req, res) {
    try {
      const { id } = req.params;
      const { data } = req.body;
      const pixelId = await this.pixelService.updatePixelInDatabase(data, id);
      res.status(200).json(pixelId);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }

  async deletePixel(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.pixelService.deletePixelInDatabase(id);
      res.status(200).json(deleted);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }

}

module.exports = PixelsController;
