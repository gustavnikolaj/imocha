const { resolve } = require("path");
const minimatch = require("minimatch");
// TODO: Mocha should be a peerDep, lookupFiles was moved to the utils file in 1.21.5.
const utils = require("mocha/lib/utils");

/* This file is lifted out of `bin/_mocha` [1]. We duplicate mocha's logic to
 * find the relevant files to build our dependency graph from.
 * [1]: https://github.com/mochajs/mocha/blob/d401ee198bd5026bc61641ad26eab31e6746713f/bin/_mocha
 */

module.exports = function findFilesMochaWouldRun(program) {
  const extensions = ["js"];

  // We don't hook up any of the compilers, but use them to extend which
  // filetypes to glob for - handled by `utils.lookupFiles`.
  program.compilers.forEach(c => {
    const idx = c.indexOf(":");
    const ext = c.slice(0, idx);
    extensions.push(ext);
  });

  let files = [];

  // Clone the array - mocha does not, but also only runs it one time, where we
  // will likely need to run this method over and over during long sessions.
  const args = [...program.args];

  // Set default match pattern if none is passed.
  if (!args.length) {
    // args.push("test");
  }

  args.forEach(arg => {
    let newFiles;
    try {
      newFiles = utils.lookupFiles(arg, extensions, program.recursive);
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
        program.exclude.every(pattern => !minimatch(fileName, pattern))
      );
    }

    files = files.concat(newFiles);
  });

  // resolve
  let fileArgs = program.file.map(path => resolve(path));
  files = files.map(path => resolve(path));

  if (program.sort) {
    files.sort();
  }

  // add files given through --file to be ran first
  files = fileArgs.concat(files);

  return files;
};
