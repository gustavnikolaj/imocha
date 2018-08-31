const SourceGraph = require("./SourceGraph");
const GitClient = require("./GitClient");
const MochaWorker = require("./MochaWorker");
const MochaWatch = require("./MochaWatch");
const Prompt = require("./Prompt");

const loadMochaOptions = require("./loadMochaOptions");
const loadMochaOptsIntoArgs = require("./loadMochaOptsIntoArgs");
const findFilesMochaWouldRun = require("./findFilesMochaWouldRun");

module.exports = async function cli(cwd) {
  const args = loadMochaOptsIntoArgs();
  const program = loadMochaOptions(args);
  const files = findFilesMochaWouldRun(program);

  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new MochaWorker(program, args);
  const mochaWatch = new MochaWatch(
    cwd,
    gitClient,
    sourceGraph,
    mochaWorker,
    program,
    files
  );

  await sourceGraph.populate(files);

  mochaWatch.init();

  const prompt = new Prompt({
    stdout: process.stdout,
    stdin: process.stdin,
    onRunTests: (testMode, optsMode, args) => {
      let testRunArgs;

      switch (optsMode) {
        case "grep":
          testRunArgs = ["-g"].concat(args);
          break;
      }

      switch (testMode) {
        case "changed":
          mochaWatch.queueTestRun("changed", testRunArgs);
          break;
        case "all":
          mochaWatch.queueTestRun("all", testRunArgs);
          break;
      }
    }
  });
  prompt.executePrompt().then(() => {
    mochaWatch.stop();
    process.stdin.end("\n");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    process.stdin.end("\n");
  });
};
