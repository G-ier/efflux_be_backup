function preferredOrder(obj, order) {
  let newObject = {};
  for(let i = 0; i < order.length; i++) {
    newObject[order[i]] = obj[order[i]];
  }
  return newObject;
}

function formatDateToISO(date) {
  // Ensure the input is a Date object
  if (!(date instanceof Date)) {
      throw new Error('Input must be a Date object');
  }

  const pad = (number) => (number < 10 ? '0' + number : number);

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds());
}

function cleanData(parsedData) {
  // if parsedData.org_id is not set, set it to 1
  // if it's set, convert it to Int32
  if (!parsedData["org_id"]) {
    parsedData["org_id"] = 1;
  } else {
    parsedData["org_id"] = parseInt(parsedData["org_id"]);
  }

  parsedData["date"] = parsedData["date"] ?
    formatDateToISO(new Date(parsedData["date"])) : formatDateToISO(new Date());
  parsedData["traffic_source_updated_at"] = parsedData["traffic_source_updated_at"] ?
    formatDateToISO(new Date(parsedData["traffic_source_updated_at"])) : formatDateToISO(new Date());
  parsedData["network_updated_at"] = parsedData["network_updated_at"] ?
    formatDateToISO(new Date(parsedData["network_updated_at"])) : formatDateToISO(new Date());

  const fieldMappings = {
    searches: "nbr_of_searches",
    lander_visits: "nbr_of_lander_visits",
    impressions: "nbr_of_impressions",
    visitors: "nbr_of_visitors",
    tracked_visitors: "nbr_of_tracked_visitors",
    pb_conversions: "postback_conversions",
    pb_lander_conversions: "postback_lander_conversions",
    pb_serp_conversions: "postback_serp_conversions",
    ts_conversions: "traffic_source_conversions",
    ts_clicks: "traffic_source_clicks",
    ts_updated_at: "traffic_source_updated_at",
    nw_conversions: "network_conversions",
    nw_uniq_conversions: "network_unique_conversions",
  };

  Object.entries(fieldMappings).forEach(([oldField, newField]) => {
    if (parsedData.hasOwnProperty(oldField)) {
      parsedData[newField] = parsedData[oldField];
      delete parsedData[oldField];
    }
  });

  return parsedData;
}

module.exports = {
  preferredOrder,
  cleanData,
  formatDateToISO
}
