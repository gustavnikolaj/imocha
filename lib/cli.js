const SourceGraph = require("./SourceGraph");
const GitClient = require("./GitClient");
const findTestFilesToRun = require("./findTestFilesToRun");
const MochaWorker = require("./MochaWorker");

module.exports = async function cli(cwd, args) {
  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);
  const mochaWorker = new MochaWorker();

  await sourceGraph.populate();

  const relatedTestFiles = await findTestFilesToRun(sourceGraph, gitClient);

  const { exitCode } = await mochaWorker.runTests(relatedTestFiles);

  console.log("Done with exitCode", exitCode);
};

// TODO: Make into a monitoring process that keeps running
// TODO: Add update method to SourceGraph Files, used when watching for file changes
// TODO: Implement chokidar based watcher https://www.npmjs.com/package/chokidar
