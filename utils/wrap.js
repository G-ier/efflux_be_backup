module.exports = function wrap(fn) {
  return (...args) => fn(...args).catch(args[2]);
}
