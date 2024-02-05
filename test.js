const { default: axios } = require('axios');
const AggregatesService = require('./src/modules/aggregates/services/AggregatesService');
const main = async () => {
  const url = 'https://7yhdw8l2hf.execute-api.us-east-1.amazonaws.com/'; // The API endpoint
  const response = await axios.get(url);
  console.log(response.data);
};
main();
