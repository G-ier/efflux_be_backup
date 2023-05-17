const pixelsService = require('../services/pixelsService');
const usersService = require('../services/usersService');

async function getPixels(authUser, orderBy, fields) {
  const {isAdmin, providerId} = authUser;
  let userId;
  if (!isAdmin) {
    // Get the user making the request if he is not admin
    const user = await usersService.getSingle({providerId}, ['id'])
    userId = user.id;
    return await pixelsService.getUserPixels(userId ,orderBy, fields);
  }
  return await pixelsService.getAll(orderBy, fields);
}

async function getPixel(id, fields) {
  return await pixelsService.getOne(id, fields);
}

async function addPixel(pixelData, fields) {
  return await pixelsService.add(pixelData, fields)
}

async function updatePixel(pixel_id, updateData, fields) {
  return await pixelsService.update(pixel_id, updateData, fields);
}

async function deletePixel(pixel_id) {
  return await pixelsService.deleteOne(pixel_id);
}

module.exports = {
  getPixels,
  getPixel,
  updatePixel,
  deletePixel,
  addPixel
};
