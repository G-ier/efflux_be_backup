const mirror = require('../common/mirror');

const PROPER_LABELS = {
  term: 'UTM Term',
  adset_id: 'UTM Content',
  revenue: 'Estimated Revenue',
  visitors: 'Sessions',
  dateHour: 'Hour',
}

module.exports = {
  PROPER_LABELS,
  PROPER_MIRROR: mirror(PROPER_LABELS),
}
