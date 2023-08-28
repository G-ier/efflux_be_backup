class Campaign {
  constructor(
    name,
    created_time,
    updated_time,
    id,
    status,
    user_id,
    account_id,
    ad_account_id,
    daily_budget,
    lifetime_budget,
    budget_remaining
  ) {
    this.name = name;
    this.created_time = created_time;
    this.updated_time = updated_time;
    this.traffic_source = 'facebook';
    this.id = id;
    this.status = status;
    this.user_id = user_id;
    this.account_id = account_id;
    this.ad_account_id = ad_account_id;
    this.daily_budget = daily_budget;
    this.lifetime_budget = lifetime_budget;
    this.budget_remaining = budget_remaining;
    this.network = 'unknown';
  }
}

module.exports = Campaign;
