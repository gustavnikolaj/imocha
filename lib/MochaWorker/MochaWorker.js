const { fork } = require("child_process");
const workerModulePath = require.resolve("./mochaWorker-forked-entrypoint");

module.exports = class MochaWorker {
  constructor() {
    this.state = "stopped";
  }

  async runTests(testFilePaths) {
    if (!this.state === "stopped") {
      throw new Error("Already running.");
    }

    return new Promise((resolve, reject) => {
      try {
        this.state = "started";
        const worker = fork(workerModulePath, testFilePaths, {
          stdio: "inherit"
        });

        worker.on("close", exitCode => {
          this.state = "stopped";
          return resolve({ exitCode });
        });
      } catch (e) {
        this.state = "stopped";
        return reject(e);
      }
    });
  }
};
