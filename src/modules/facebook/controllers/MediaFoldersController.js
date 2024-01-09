const MediaFoldersService = require('../services/MediaFoldersService');

class MediaFoldersController {
  constructor() {
    this.mediaFoldersService = new MediaFoldersService();
  }

  async fetchMediaFolders(req, res) {
    const { filters } = req.body;
    const org_id = req.user.org_id;
    const mediaFolders = await this.mediaFoldersService.fetchMediaFolders({ ...filters, org_id });
    res.json(mediaFolders);
  }

  async createMediaFolder(req, res) {
    const { folder_name, parent_id } = req.body;
    const org_id = req.user.org_id;
    const user_id = req.user.id;
    if (!folder_name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    try {
      const mediaFolder = await this.mediaFoldersService.createMediaFolder(
        user_id,
        folder_name,
        org_id,
        parent_id,
      );
      res.json(mediaFolder);
    } catch {
      res.status(400).json({ message: 'Something went wrong' });
    }
  }

  async updateMediaFolder(req, res) {
    try {
      const { id } = req.params;
      const org_id = req.user.org_id;
      const { folder_name, parent_id } = req.body;
      const mediaFolder = await this.mediaFoldersService.updateMediaFolder(
        id,
        org_id,
        folder_name,
        parent_id,
      );
      res.json(mediaFolder);
    } catch (error) {
      console.log('error', error);
      res.status(400).json(error);
    }
  }

  async deleteMediaFolder(req, res) {
    try {
      const { id } = req.params;
      const org_id = req.user.org_id;
      const mediaFolder = await this.mediaFoldersService.deleteMediaFolder(id, org_id);
      res.json(mediaFolder);
    } catch (error) {
      console.log('error', error);
      res.status(404).json(error);
    }
  }
}

module.exports = MediaFoldersController;
