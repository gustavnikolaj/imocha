// TODO: Use https://github.com/mochajs/mocha/blob/master/lib/cli/collect-files.js when it's released.

const { resolve } = require("path");
const minimatch = require("minimatch");
const utils = require("mocha/lib/utils"); // peer-dep-req[mocha]: >1.21.5

/* This file is lifted out of `bin/_mocha` [1]. We duplicate mocha's logic to
 * find the relevant files to build our dependency graph from.
 * [1]: https://github.com/mochajs/mocha/blob/d401ee198bd5026bc61641ad26eab31e6746713f/bin/_mocha
 */

module.exports = function findFilesMochaWouldRun({
  extension,
  recursive,
  exclude = [],
  spec,
  sort,
  file
} = {}) {
  let files = [];
  const mochaArgs = Array.isArray(spec) && spec.length > 0 ? spec : ["test"];

  mochaArgs.forEach(arg => {
    let newFiles;
    try {
      newFiles = utils.lookupFiles(arg, extension, recursive);
    } catch (err) {
      if (err.message.indexOf("cannot resolve path") === 0) {
        console.error(
          `Warning: Could not find any test files matching pattern: ${arg}`
        );
        return;
      }

      throw err;
    }

    if (typeof newFiles !== "undefined") {
      if (typeof newFiles === "string") {
        newFiles = [newFiles];
      }
      newFiles = newFiles.filter(fileName =>
        exclude.every(pattern => !minimatch(fileName, pattern))
      );
    }

    files = files.concat(newFiles);
  });

  // resolve
  const fileArgs = (file && file.map(path => resolve(path))) || [];
  files = files.map(path => resolve(path));

  if (sort) {
    files.sort();
  }

  // add files given through --file to be ran first
  files = fileArgs.concat(files);

  return files;
};
