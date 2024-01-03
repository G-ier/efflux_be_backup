class Permission {
    constructor(
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    ) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.is_active = is_active;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = Permission;
  