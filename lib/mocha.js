/* This module reexports some utilities from mocha. The reason we do the
 * reexport is to contain the logic around finding the right mocha to get the
 * dependencies from.
 */

const debug = require("debug")("imocha");
const resolveFrom = require("resolve-from");
let localMochaPkgJsonPath;

try {
  localMochaPkgJsonPath = resolveFrom(process.cwd(), "mocha/package.json");
} catch (e) {
  if (e.code !== "MODULE_NOT_FOUND") {
    throw e;
  }
}

let mochaInfo = null;

if (localMochaPkgJsonPath) {
  const localMochaPkgJson = require(localMochaPkgJsonPath);

  exports.mochaBin = resolveFrom(process.cwd(), "mocha/bin/mocha");
  exports.utils = require(resolveFrom(process.cwd(), "mocha/lib/utils"));
  exports.loadOptions = require(resolveFrom(
    process.cwd(),
    "mocha/lib/cli/options"
  )).loadOptions;

  mochaInfo = {
    local: true,
    version: localMochaPkgJson.version,
    path: localMochaPkgJsonPath.replace(/\/package.json$/, "")
  };
} else {
  // We don't have mocha installed in the project, so we have to fall back on using our own.
  const mochaPkgJsonPath = require.resolve("mocha/package.json");
  const mochaPkgJson = require(mochaPkgJsonPath);

  exports.mochaBin = require.resolve("mocha/bin/mocha");
  exports.utils = require("mocha/lib/utils");
  exports.loadOptions = require("mocha/lib/cli/options").loadOptions;

  mochaInfo = {
    local: false,
    version: mochaPkgJson.version,
    path: mochaPkgJsonPath.replace(/\/package.json$/, "")
  };
}

debug(
  "Using %s mocha version %s from %s",
  mochaInfo.local ? "projects" : "imochas",
  mochaInfo.version,
  mochaInfo.path
);
