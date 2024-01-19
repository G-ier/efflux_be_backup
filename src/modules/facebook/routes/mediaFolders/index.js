const route = require("express").Router();
const MediaFoldersController = require("../../controllers/MediaFoldersController");

const mediaFoldersController = new MediaFoldersController();

// @route    GET /api/facebook/media_folders
// @desc     Fetches all media folders for a user
// @Access   Private
route.get("/", async (req, res) => {
  return await mediaFoldersController.fetchMediaFolders(req, res);
});

// @route    POST /api/facebook/media_folders
// @desc     Create a media folder
// @Access   Private
route.post("/", async (req, res) => {
  return await mediaFoldersController.createMediaFolder(req, res);
});

// @route    PUT /api/facebook/media_folders/:id
// @desc     Update a media folder
// @Access   Private
route.put("/:id", async (req, res) => {
  return await mediaFoldersController.updateMediaFolder(req, res);
});

// @route    DELETE /api/facebook/media_folders/:id
// @desc     Delete a media folder
// @Access   Private
route.delete("/:id", async (req, res) => {
  return await mediaFoldersController.deleteMediaFolder(req, res);
});


module.exports = route;
