const SourceGraph = require("./SourceGraph");
const GitClient = require("./GitClient");
const MochaWorker = require("./MochaWorker");
const MochaWatch = require("./MochaWatch");

module.exports = async function cli(cwd, args) {
  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new MochaWorker();
  const mochaWatch = new MochaWatch(gitClient, sourceGraph, mochaWorker);

  await sourceGraph.populate();

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
