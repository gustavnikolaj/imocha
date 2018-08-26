// const { join, resolve } = require("path");
const { resolve } = require("path");
const minimatch = require("minimatch");
// TODO: Mocha should be a peerDep
// TODO: Find out which version of mocha introduced the lookupFiles method.
const utils = require("mocha/lib/utils");

/* This file is lifted out of `bin/_mocha` [1]. We duplicate mocha's logic to
 * find the relevant files to build our dependency graph from.
 * [1]: https://github.com/mochajs/mocha/blob/d401ee198bd5026bc61641ad26eab31e6746713f/bin/_mocha
 */

module.exports = function findFilesMochaWouldRun(program) {
  const extensions = ["js"];
  // TODO: Adapt this to only populate the extensions array.
  // program.compilers.forEach(c => {
  //   const idx = c.indexOf(":");
  //   const ext = c.slice(0, idx);
  //   let mod = c.slice(idx + 1);

  //   if (mod[0] === ".") {
  //     mod = join(process.cwd(), mod);
  //   }
  //   require(mod);
  //   extensions.push(ext);
  //   program.watchExtensions.push(ext);
  // });

  let files = [];

  // Clone the array - mocha does not, but also only runs it one time, where we
  // will likely need to run this method over and over during long sessions.
  const args = [...program.args];

  // default files to test/*.{js,coffee}
  if (!args.length) {
    args.push("test");
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

  // Mocha ejects if there is no files found. We don't need to.
  // if (!files.length) {
  //   console.error("No test files found");
  //   process.exit(1);
  // }

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
