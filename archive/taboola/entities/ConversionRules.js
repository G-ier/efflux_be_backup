class ConversionRule {
    constructor({
      id,
      display_name,
      look_back_window,
      category,
      status,
      type,
      event_name,
      include_in_total_conversions,
      exclude_from_campaigns,
      description,
      advertiser_id,
      last_modified_by,
      last_modified_at,
    }) {
      this.id = id;
      this.display_name = display_name;
      this.look_back_window = look_back_window;
      this.category = category;
      this.status = status;
      this.type = type;
      this.event_name = event_name;
      this.include_in_total_conversions = include_in_total_conversions;
      this.exclude_from_campaigns = exclude_from_campaigns;
      this.description = description;
      this.advertiser_id = advertiser_id;
      this.last_modified_by = last_modified_by;
      this.last_modified_at = last_modified_at;
    }
  }
  
module.exports = ConversionRule;