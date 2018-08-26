const { Command } = require("commander");

/**
 * Parse list.
 */
const list = str => str.split(/ *, */);

/**
 * Parse multiple flag.
 */
const collect = (val, memo) => memo.concat(val);

module.exports = function loadMochaOptions(args) {
  const program = new Command();

  // This set of options are selective copy/paste from the argument parsing in
  // the `bin/_mocha` file of the mocha repository, as of commit
  // `d401ee198bd5026bc61641ad26eab31e6746713f` [1], with some comments for our
  // reasoning behind duplicating them here.

  program
    .usage("[debug] [options] [files]")
    // The watch option for mocha will result in some weird behavior combined
    // with our implementation of watch mode. We pick it up here so that we can
    // throw if it is passed.
    .option("-w, --watch", "watch files for changes")
    // The grep information could also impact which tests to run - not sure if
    // they make sense in this usecase though. At least warnings could be thrown
    // if they are passed.
    .option("-g, --grep <pattern>", "only run tests matching <pattern>")
    .option("-f, --fgrep <string>", "only run tests containing <string>")
    .option("-i, --invert", "inverts --grep and --fgrep matches")
    // The compilers option is used to derive what other extensions than .js we
    // should look for.
    .option(
      "--compilers <ext>:<module>,...",
      "use the given module(s) to compile files",
      list,
      []
    )
    // This will affect the files that we should include as well.
    .option("--recursive", "include sub directories")
    //
    .option("--exclude <file>", "a file or glob pattern to ignore", collect, [])
    //
    .option(
      "--file <file>",
      "include a file to be ran during the suite",
      collect,
      []
    );

  program.parse(args);

  return program;
};

// [1]: https://github.com/mochajs/mocha/blob/d401ee198bd5026bc61641ad26eab31e6746713f/bin/_mocha
