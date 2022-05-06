function mirror(source) {
  let target = {};

  Object.keys(source).forEach((key) => {
    const value = source[key];
    target[value] = key;
  });

  return target;
}

module.exports = mirror;
