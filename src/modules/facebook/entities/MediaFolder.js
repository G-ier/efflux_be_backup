class MediaFolder {
    constructor(
      id,
      parent_id,
      user_id,
      folder_name,
      created_at,
      updated_at,
      org_id
      ) {
        this.id = id;
        this.parent_id = parent_id;
        this.user_id = user_id;
        this.folder_name = folder_name;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.org_id = org_id;
    }
}

module.exports = MediaFolder;
