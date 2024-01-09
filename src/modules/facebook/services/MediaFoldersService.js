const MediaFoldersRepository = require("../repositories/MediaFoldersRepository");

class MediaFoldersService {
  constructor() {
    this.mediaFoldersRepository = new MediaFoldersRepository();
  }

  async fetchMediaFolders(criteria) {
    const mediaFolders = await this.mediaFoldersRepository.fetchMediaFolders(criteria);
    return mediaFolders;
  }

  async createMediaFolder(userAccountId, folderName, orgId, parentId) {
    const mediaFolder = await this.mediaFoldersRepository.createMediaFolder(userAccountId, folderName, orgId, parentId);
    return mediaFolder;
  }

  async updateMediaFolder(id, orgId, folderName, parentId) {
    const mediaFolder = await this.mediaFoldersRepository.updateMediaFolder(id, orgId, folderName, parentId);
    return mediaFolder;
  }

  async deleteMediaFolder(id,orgId) {
    const mediaFolder = await this.mediaFoldersRepository.deleteMediaFolder(id,orgId);
    return mediaFolder;
  }
}


module.exports = MediaFoldersService;
