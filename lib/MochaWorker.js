const { spawn } = require("child_process");
const { mochaBin } = require("./mocha");
const debug = require("debug")("imocha:MochaWorker");

module.exports = class MochaWorker {
  constructor(mochaOpts, args) {
    this.args = args;
    this.mochaOpts = mochaOpts;
    this.state = "stopped";
  }

  generateArgs(testFilePaths) {
    // Filter out any spec args that was passed to us - and then add the
    // testFilePaths that we decided are relevant. This will make mocha run only
    // the files that we pass as the default glob of test/* is overriden and
    // whatever might have been in mocha.opts is removed.
    const args = this.mochaOpts.spec
      ? this.args.filter(arg => this.mochaOpts.spec.indexOf(arg) === -1)
      : this.args;

    return args.concat(testFilePaths);
  }

  runTests(testFilePaths) {
    // Allows us to overwrite the method in tests.
    const { childProcessSpawn } = module.exports;

    debug("run tests");

    if (this.state !== "stopped") {
      debug("aborting test run - already running.");
      return Promise.reject(new Error("Already running."));
    }

    if (testFilePaths.length === 0) {
      debug("short circuiting test run - no tests to run.");
      return Promise.resolve({ exitCode: 0, testDuration: -1 });
    }

    return new Promise((resolve, reject) => {
      debug("spawning mocha");
      try {
        this.state = "started";
        const startTime = Date.now();
        const worker = childProcessSpawn(
          mochaBin,
          this.generateArgs(testFilePaths),
          { stdio: "inherit", env: { ...process.env } }
        );

        worker.on("close", exitCode => {
          this.state = "stopped";
          const testDuration = Date.now() - startTime;
          debug("test run complete");
          return resolve({ exitCode, testDuration });
        });
      } catch (e) {
        debug("could not spawn mocha");
        this.state = "stopped";
        return reject(e);
      }
    });
  }
};

module.exports.childProcessSpawn = spawn;
