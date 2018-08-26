const getOptions = require("mocha/bin/options"); // peer-dep-req[mocha]: >2.2.4

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
