const SourceGraph = require("./SourceGraph");
const GitClient = require("./GitClient");
const findTestFilesToRun = require("./findTestFilesToRun");

module.exports = async function cli(cwd, args) {
  const sourceGraph = new SourceGraph(cwd);
  const gitClient = new GitClient(cwd);

  await sourceGraph.populate();

  const relatedTestFiles = await findTestFilesToRun(sourceGraph, gitClient);

  console.log(...relatedTestFiles);
};

// TODO: Make into a monitoring process that keeps running
// TODO: Add update method to SourceGraph Files, used when watching for file changes
// TODO: Execute tests with mocha.
//       (Easy-mode: runShellCommand(`mocha ...relatedTestFiles`))
