// Local application imports
const CompositeService = require('./src/modules/facebook/services/CompositeService');

const main = async () => {
  const compositeService = new CompositeService();
  await compositeService.updateFacebookData("2023-08-29")
}

main()
