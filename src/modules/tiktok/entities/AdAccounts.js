class AdAccount {
  constructor(
    name,
    id,
    amount_spent,
    balance,
    spend_cap,
    currency,
    timezone_name,
    timezone_offset_hours_utc,
    account_id
  ) {
    this.name = name;
    this.id = id;
    this.amount_spent = amount_spent;
    this.balance = balance;
    this.spend_cap = spend_cap;
    this.currency = currency;
    this.timezone_name = timezone_name;
    this.timezone_offset_hours_utc = timezone_offset_hours_utc;
    this.account_id = account_id;
  }
}

module.exports = AdAccount;
