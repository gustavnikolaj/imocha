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

  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new MochaWorker(program, args);
  const mochaWatch = new MochaWatch(
    cwd,
    gitClient,
    sourceGraph,
    mochaWorker,
    program
  );

  const files = findFilesMochaWouldRun(program);
  await sourceGraph.populate(files);

  mochaWatch.init();

  const prompt = new Prompt({
    stdout: process.stdout,
    stdin: process.stdin,
    onRunTests: (runKey, args) => {
      switch (runKey) {
        case "all":
          mochaWatch.queueTestRun();
          break;
        case "grep":
          mochaWatch.queueTestRun(["-g"].concat(args));
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
