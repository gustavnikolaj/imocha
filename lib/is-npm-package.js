module.exports = function isNpmPackage(str) {
  return /^(\w|@)/.test(str);
};
