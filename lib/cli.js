const SourceGraph = require("./SourceGraph");
const GitClient = require("./GitClient");
const MochaWorker = require("./MochaWorker");
const MochaWatch = require("./MochaWatch");

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

  process.stdin.on("readable", () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      mochaWatch.queueTestRun();
    }
  });

  process.on("SIGINT", () => {
    mochaWatch.stop();
    process.stdin.end("\n");
  });
};
