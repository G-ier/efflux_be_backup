function isNotNumeric(str) {
  return isNaN(parseFloat(str)) || !isFinite(str);
}

const calculateAccumulated = (data, keys=['revenue', 'clicks', 'visitors']) => {
  return data.reduce((acc, item) => {
    keys.forEach(key => {
      if (!acc[key]) acc[key] = 0
      acc[key] += item[key]
    })
    return acc
  }, {})
}

module.exports = {
  isNotNumeric,
  calculateAccumulated
}
