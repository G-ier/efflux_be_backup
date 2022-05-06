const _ = require('lodash');
const { ADVERONIX_KEYMAP, ADVERONIX_MIRROR, ADV_GDN_KEYMAP, ADV_GDN_VALUE_MAP} = require('../constants/adveronix');
const { CROSSROADS_MIRROR, CROSSROADS_LABELS} = require('../constants/crossroads');
const { AMG_KEYMAP, AMG_VALUE_MAP } = require('../constants/amg');
const { processCrossroadItem } = require('./processedFields')

const COMMON_LABELS = {
  updated_at: 'Updated At'
}

function convertFromRows(head, entries) {
  return entries.map((values) => {
    const item = {};
    head.forEach((head_key, i) => {
      const key = ADVERONIX_KEYMAP[head_key] || CROSSROADS_MIRROR[head_key] || null;
      if (!key) return;
      item[key] = values[i];
    });
    return item;
  });
}

function convertFromAMGRows(head, entries) {
  return entries.map((values) => {
    const item = {};
    head.forEach((head_key, i) => {
      const key = AMG_KEYMAP[head_key] || null;
      if (key === null) return;
      const value = AMG_VALUE_MAP[key] ? AMG_VALUE_MAP[key](values[i]) : values[i];
      item[key] = value;
    });
    return item;
  });
}

function convertToRows(keys, collection) {
  return collection.map((item) => {
    return keys.map((key) => item[key]);
  });
}

function mergeWithCrossroads(data, crossroads) {
  return data.map((item) => {
    let cr_row = crossroads.find((cr) => cr.cr_campaign_id === item.adv_campaign_id);
    if (!cr_row) {
      cr_row = processCrossroadItem({
        cr_revenue: 0,
        cr_searches: 0,
        cr_lander_visits: 0,
        cr_revenue_clicks: 0,
        cr_visitors: 0,
        cr_tracked_visitors: 0
      })
    }
    return { ...item, ...cr_row };
  });
}

function getAdveronixKeys() {
  return Object.values(ADVERONIX_KEYMAP);
}

function getCrossroadsKeys(head) {
  return Object.keys(CROSSROADS_LABELS);
}

function translateHead(keys) {
  return keys.map((key) => ADVERONIX_MIRROR[key] || CROSSROADS_LABELS[key] || COMMON_LABELS[key] || '');
}

function convertToGDN(data) {
  const res =  data.map((item) => _(item)
    .pickBy((_, key) => ADV_GDN_KEYMAP[key])
    .mapKeys((_, key) => ADV_GDN_KEYMAP[key])
    .mapValues((value, key) => ADV_GDN_VALUE_MAP[key] ? ADV_GDN_VALUE_MAP[key](value) : value)
    .value()
  );
  return res;
}

module.exports = {
  convertFromRows,
  convertFromAMGRows,
  convertToRows,
  convertToGDN,
  mergeWithCrossroads,
  getCrossroadsKeys,
  getAdveronixKeys,
  translateHead,
}
