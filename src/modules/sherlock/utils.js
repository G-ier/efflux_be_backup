const { unmarshall } = require('@aws-sdk/util-dynamodb');
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

function cleanData(parsedData) {
  // unmarshall it & delete org_id
  parsedData = parsedData.map((item) => {
    delete item['org_id'];
    item['bad_links_data'] = unmarshall(item['bad_links_data']);
    item['badly_accessed_data'] = unmarshall(item['badly_accessed_data']);
    item['created_at'] = formatDateToISO(new Date(item['created_at']));

    return item;
  });

  return parsedData;
}

module.exports = {
  cleanData,
  formatDateToISO,
};
