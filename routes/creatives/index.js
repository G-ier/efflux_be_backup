const route = require("express").Router();
const CreativeManager = require('../../controllers/creativesController');

// @route     /api/creatives/download-creatives
// @desc     Downloads creatives and uploads them to the CDN
// @Access   Private
route.post("/download-creatives", async (req, res) => {

  // Ideally these will be images in bulk
  const creativesData = req.body;

  try {
    // Map each creativeData to a promise
    const promises = creativesData.map(async (creativeData) => {

      const creativeURL = creativeData.creative_url;
      const creativeType = creativeData.creative_type;
      const adArchiveID = creativeData.ad_archive_id;

      await CreativeManager.download_creatives(
        creativeURL,
        creativeType,
        adArchiveID
      );
    });

    // Send the results
    res.status(200).send('process complete');

    // Wait for all promises to resolve
    await Promise.all(promises);

  } catch (error) {
    // Send error response
    res.status(500).send({ error: 'An error occurred while processing creatives data.' });
  }

});


module.exports = route;
