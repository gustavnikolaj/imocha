const SourceGraph = require("./SourceGraph");
const MochaWorker = require("./MochaWorker");
const MochaWatch = require("./MochaWatch");
const debug = require("./debug");
const { loadOptions, mochaInfo } = require("./mocha");

module.exports = function cli(cwd, args) {
  debug(
    "Using %s mocha version %s from %s",
    mochaInfo.local ? "projects" : "imochas",
    mochaInfo.version,
    mochaInfo.path
  );

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

  mochaWatch.on("debug", debug);

  mochaWatch.on("run begin", () => {
    if (!process.env.DEBUG) {
      process.stdout.write("\x1B[2J");
    }

    console.log("Running tests at", new Date());
  });

  mochaWatch.on("run complete", result => {
    const { testDuration } = result;

    if (testDuration === -1) {
      console.log("\nNo tests to run.");
    } else if (process.env.DEBUG) {
      console.log("%sms", result.testDuration);
    }
  });

  let stdinEnded = false;
  process.stdin.on("end", () => {
    stdinEnded = true;
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    if (!stdinEnded) {
      process.stdin.end("\n");
      stdinEnded = true;
    }
  });
};
