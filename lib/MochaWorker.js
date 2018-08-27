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

    if (!process.env.DEBUG) {
      process.stdout.write("\x1B[2J");
    }

    console.log("Running tests at", new Date());

    if (testFilePaths.length === 0) {
      console.log("\nNo tests to run.");
      return;
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
          if (process.env.DEBUG) {
            console.log("%sms", Date.now() - startTime);
          }
          return resolve({ exitCode });
        });
      } catch (e) {
        this.state = "stopped";
        return reject(e);
      }
    });
  }
};
