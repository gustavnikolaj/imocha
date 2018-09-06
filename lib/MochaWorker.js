const { spawn } = require("child_process");

module.exports = class MochaWorker {
  constructor(program, rawArgs) {
    this.args = rawArgs.slice(2);
    this.program = program;
    this.state = "stopped";
  }

  generateArgs(testFilePaths) {
    // filter out arguments that we would pass by default. this will make mocha
    // only run the files that we pass as the default glob of test/* is
    // overriden and whatever might have been in mocha.opts is removed.
    let args = this.args.filter(arg => this.program.args.indexOf(arg) === -1);

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
