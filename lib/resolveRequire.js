const isNpmPackage = require("./isNpmPackage");
const resolveFrom = require("resolve-from");

module.exports = function resolveRequire(context, requiredPath) {
  if (isNpmPackage(requiredPath)) {
    throw new Error("Module resolution not yet implemented");
  }

  try {
    return resolveFrom(context, requiredPath);
  } catch (e) {
    return null;
  }
};
