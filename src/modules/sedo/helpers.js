
const calculateAccumulated = (data) => {
  return data.reduce((acc, item) => {
    const visitors = item.uniques[0]._ ? parseInt(item.uniques[0]._) : 0;
    const clicks = item.clicks[0]._ ? parseInt(item.clicks[0]._) : 0;
    const earnings = item.earnings[0]._ ? parseFloat(item.earnings[0]._) : 0;
    acc.visitors += visitors
    acc.clicks += clicks
    acc.earnings += earnings
    return acc
  }, {
    visitors: 0,
    clicks: 0,
    earnings: 0,
  })
}

module.exports = {
  calculateAccumulated
}

