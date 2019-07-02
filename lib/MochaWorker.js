const { spawn } = require("child_process");

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

  async runTests(testFilePaths) {
    if (!this.state === "stopped") {
      throw new Error("Already running.");
    }

    if (testFilePaths.length === 0) {
      return { exitCode: 0, testDuration: -1 };
    }

    return new Promise((resolve, reject) => {
      try {
        this.state = "started";
        const startTime = Date.now();
        // We cannot prevent `mocha/bin/mocha` from loading the options out of
        // `mocha.opts`, so we need to use `mocha/bin/_mocha` but that means
        // that we won't be able to handle node specific flags when running the
        // tests through this watcher.
        const worker = spawn(
          require.resolve("mocha/bin/_mocha"),
          this.generateArgs(testFilePaths),
          {
            stdio: "inherit",
            env: {
              ...process.env,
              LOADED_MOCHA_OPTS: "true"
            }
          }
        );

        worker.on("close", exitCode => {
          this.state = "stopped";
          const testDuration = Date.now() - startTime;
          return resolve({ exitCode, testDuration });
        });
      } catch (e) {
        this.state = "stopped";
        return reject(e);
      }
    });
  }
};
