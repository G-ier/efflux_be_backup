const CreativeManager = require('./controllers/creativesController');

creativesData = [
    {
        'creative_url': 'https://scontent.ftia12-1.fna.fbcdn.net/v/t39.35426-6/355115257_23924005260520067_7618296172175907749_n.jpg?stp=dst-jpg_s600x600&_nc_cat=104&ccb=1-7&_nc_sid=cf96c8&_nc_ohc=i0i2H-MLuqkAX_iY9X4&_nc_ht=scontent.ftia12-1.fna&oh=00_AfDn0cohHwvAWiqJ1rN888ONFakrYnmACw68VZ0Dq4zHgQ&oe=64ACC400',
        'creative_type': 'image',
        'ad_archive_id': '0000001'
    },
    {
        'creative_url': 'https://scontent.ftia12-1.fna.fbcdn.net/v/t42.1790-2/10000000_248928394530734_9070941085951289361_n.?_nc_cat=106&ccb=1-7&_nc_sid=cf96c8&_nc_ohc=SeN0BpYldtQAX-QAIb6&_nc_ht=scontent.ftia12-1.fna&oh=00_AfA_CX3PD4rnSffHQ5VI8Ht8gvT9pobbN8cVTnrNP20n7Q&oe=64AD12E0',
        'creative_type': 'video',
        'ad_archive_id': '0000002'
    }
]

const main = async () => {

  // Map each creativeData to a promise
  const promises = creativesData.map(async (creativeData) => {

    const creativeURL = creativeData.creative_url;
    const creativeType = creativeData.creative_type;
    const adArchiveID = creativeData.ad_archive_id;

    console.log("Root Directory: ", CreativeManager.root_dir)

    await CreativeManager.download_creatives(
      creativeURL,
      creativeType,
      adArchiveID
    );

  });

  // Wait for all promises to resolve
  await Promise.all(promises);

}

main();
