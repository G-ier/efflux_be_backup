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

function offsetHourByShift(dateString, hour, hourShift) {

  // Calculate total hours
  let totalHours = hour + hourShift;

  // Calculate day shift based on the total hours
  let dayShift = Math.floor(totalHours / 24);

  // Ensure the hour stays between 0 and 23
  let newHour = ((totalHours % 24) + 24) % 24;

  // Split the date string to extract year, month, and day
  const [year, month, day] = dateString.split('-').map(s => parseInt(s, 10));

  // Calculate the new date
  let newDate = new Date(year, month - 1, day + dayShift);

  // Construct the new date string
  let newDateString = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;

  return [newDateString, String(newHour).padStart(2, '0')];
}

module.exports = {
  isNotNumeric,
  calculateAccumulated,
  offsetHourByShift
}
