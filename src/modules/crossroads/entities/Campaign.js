class Campaign {
  constructor(id, name, type, user_id, account_id, created_at = new Date(), updated_at = new Date()) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.user_id = user_id;
    this.account_id = account_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Campaign;
