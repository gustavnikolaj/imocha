const SourceGraph = require("./SourceGraph");
const MochaWorker = require("./MochaWorker");
const MochaWatch = require("./MochaWatch");
const { loadOptions } = require("./mocha");

module.exports = function cli(cwd, args) {
  const mochaOpts = loadOptions(args);
  const sourceGraph = new SourceGraph(cwd);
  const mochaWorker = new MochaWorker(mochaOpts, args);
  const mochaWatch = new MochaWatch(cwd, sourceGraph, mochaWorker, mochaOpts);

  mochaWatch.init();

  process.stdin.on("readable", () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      mochaWatch.queueTestRun();
    }
  });

  mochaWatch.on("run begin", () => {
    if (!process.env.DEBUG) {
      process.stdout.write("\x1B[2J");
    }

    console.log("Running tests at", new Date());
  });

  mochaWatch.on("run complete", result => {
    if (result.testDuration === -1) {
      console.log("\nNo tests to run.");
    }
  });

  let stdinEnded = false;
  process.stdin.on("end", () => {
    stdinEnded = true;
    mochaWatch.stop();
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    if (!stdinEnded) {
      // We started listening on stdin to allow starting new test runs by
      // pressing enter. That means that people have to use CTRL+D to end stdin
      // in order for us to be able to exit - or we can destroy stdin when we
      // get CTRL+C - that will accomplish the same. We aren't receiving any
      // data on stdin, so we don't have anything to worry about. Before
      // destroying, write a newline to stdin, to prevent breaking the next line
      // in the terminal.
      process.stdin.write("\n");
      process.stdin.destroy();
    }
  });
};
