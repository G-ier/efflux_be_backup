class User {
  constructor(id, name, admin_id, created_at, updated_at, is_active) {
    this.id = id;
    this.name = name;
    this.admin_id = admin_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.is_active = is_active;
  }
}

module.exports = User;
