/* This module reexports some utilities from mocha. The reason we do the
 * reexport is to contain the logic around finding the right mocha to get the
 * dependencies from.
 */

const resolveFrom = require("resolve-from");
let localMochaPkgJsonPath;

try {
  localMochaPkgJsonPath = resolveFrom(process.cwd(), "mocha/package.json");
} catch (e) {
  if (e.code !== "MODULE_NOT_FOUND") {
    throw e;
  }
}

if (localMochaPkgJsonPath) {
  const localMochaPkgJson = require(localMochaPkgJsonPath);

  exports.mochaInfo = {
    local: true,
    version: localMochaPkgJson.version,
    path: localMochaPkgJsonPath.replace(/\/package.json$/, "")
  };

  exports.loadOptions = require(resolveFrom(
    process.cwd(),
    "mocha/lib/cli/options"
  )).loadOptions;

  exports.utils = require(resolveFrom(process.cwd(), "mocha/lib/utils"));
} else {
  // We don't have mocha installed in the project, so we have to fall back on using our own.
  // TODO: Add an actual dependency on mocha.

  exports.mochaInfo = {
    local: false,
    version: "N/A",
    path: "N/A"
  };

  throw new Error("Not yet implemented.");
}
