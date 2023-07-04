const calendar                        = require('../../../common/day');
const db                              = require('../../../data/dbConfig');

function generateActivityReport({start_date, end_date, media_buyer}) {

  const startDate = calendar.yesterdayYMD(start_date);
  const endDate = end_date;
  const mediaBuyer = media_buyer !== 'undefined' ? media_buyer : null;

  console.log("Start Date", startDate)
  console.log("End Date", endDate)

  const mediaBuyerSelectorCondition = mediaBuyer
    ? `MAX(media_buyer) as media_buyer,`
    : '';

  const mediaBuyerCondition = mediaBuyer
    ? `AND media_buyer_id = ${mediaBuyer}`
    : '';

  const query = `
    SELECT
        CONCAT('${start_date}', '/', '${endDate}') AS date,
        ${mediaBuyerSelectorCondition}
        CAST(SUM(new_campaigns_tiktok) AS FLOAT) as new_campaigns_tiktok,
        CAST(SUM(new_adsets_tiktok) AS FLOAT) as new_adsets_tiktok,
        CAST(SUM(total_tiktok_spend) AS FLOAT) as total_tiktok_spend,
        CAST(SUM(new_facebook_campaigns) AS FLOAT) as new_facebook_campaigns,
        CAST(SUM(new_adsets_facebook) AS FLOAT) as new_adsets_facebook,
        CAST(SUM(total_facebook_spend) AS FLOAT) as total_facebook_spend
    FROM activity_report
    WHERE date > '${startDate}' AND date <= '${endDate}'
    ${mediaBuyerCondition}
    ;
  `
  console.log(query)
  return db.raw(query)

};

module.exports = generateActivityReport;
