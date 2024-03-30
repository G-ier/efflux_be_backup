const printDebug = true;
function formatDateToISO(date) {
  // Ensure the input is a Date object
  if (!(date instanceof Date)) {
    throw new Error('Input must be a Date object');
  }

  const pad = (number) => (number < 10 ? '0' + number : number);

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':' +
    pad(date.getSeconds())
  );
}

function cleanData(rawData) {
  // From dynamodb to json
  if (printDebug) console.debug('RAW DATA: ', rawData);
  const parsedData = rawData.map((item) => {
    delete item['org_id'];
    if (printDebug) console.debug('ITEM: ', item);
    // convert from object to array
    item['bad_links_data'] = Object.values(item['bad_links_data']);
    item['badly_accessed_data'] = Object.values(item['badly_accessed_data']);
    item['created_at'] = formatDateToISO(new Date(item['created_at']));

    return item;
  });

  if (printDebug) console.debug('PARSED DATA: ', parsedData);

  return parsedData;
}

module.exports = {
  cleanData,
  formatDateToISO,
};
