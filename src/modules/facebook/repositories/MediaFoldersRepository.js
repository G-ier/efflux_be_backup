const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const _ = require('lodash');
const MediaFolder = require('../entities/MediaFolder');

class MediaFoldersRepository {
  constructor(database) {
    this.tableName = 'media_folders';
    this.database = database || new DatabaseRepository();
  }

  async fetchMediaFolders(criteria) {
    const results = await this.database.query(this.tableName, ['*'], criteria);
    return results;
  }

  async createMediaFolder(userAccountId, folderName, orgId, parentId) {
    const dbObject = this.toDatabaseDTO(userAccountId, folderName, orgId, parentId);
    return await this.database.insert(this.tableName, dbObject);
  }

  async updateMediaFolder(id, orgId, folderName, parentId) {
    const dbObject = this.toDatabaseDTO(folderName, parentId);
    if (_.isEmpty(dbObject)) {
      return
    }
    return await this.database.update(this.tableName, dbObject, { id, org_id: orgId });
  }

  async deleteMediaFolder(id, org_id) {
    const deletedFolder = await this.database.delete(this.tableName, { id, org_id });
    return deletedFolder;
  }

  toDatabaseDTO(userAccountId, folderName, orgId, parentId) {
    const dbObject = {
      folder_name: folderName,
      parent_id: parentId,
      org_id: orgId,
      user_id: userAccountId,
    };

    // Use omitBy to remove any fields that are undefined
    return _.omitBy(dbObject, _.isUndefined);
  }

  toDomainEntity(dbObject) {
    return new MediaFolder(
      dbObject.id,
      dbObject.user_id,
      dbObject.folder_name,
      dbObject.org_id,
      dbObject.parent_id,
      dbObject.created_at,
      dbObject.updated_at,
    );
  }
}

module.exports = MediaFoldersRepository;
