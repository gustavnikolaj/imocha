// TODO: mocha should be a peer dependency, and we should make sure that we
//       load mocha from the project root (resolve-cwd module?). The file
//       `mocha/bin/options` was introduced in mocha version 2.2.4 - so our
//       peer dependency should reflect that.
const getOptions = require("mocha/bin/options");

module.exports = function loadMochaOptsIntoArgs() {
  // getOptions is used by mocha to expand process.argv with any information
  // that is found in a related mocha.opts file. The mocha.opts file may be
  // referenced in the arguments present in progress.argv so in order to avoid
  // extending it twice the environment variable is set.

  if (!process.env.LOADED_MOCHA_OPTS) {
    getOptions();
  }

  return process.argv;
};
