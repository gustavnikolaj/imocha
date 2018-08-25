const chokidar = require("chokidar");
const findTestFilesToRun = require("./findTestFilesToRun");

module.exports = class MochaWatch {
  constructor(gitClient, sourceGraph, mochaWorker) {
    this.gitClient = gitClient;
    this.sourceGraph = sourceGraph;
    this.mochaWorker = mochaWorker;

    this.state = "stopped";

    this.watcher = null;
    this.testTimer = null;
  }

  debug(...args) {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  }

  init() {
    this.watcher = chokidar.watch("**/*.js", {
      ignored: /(^|[/\\])(\..|(node_modules))/,
      persistent: true
    });

    this.watcher
      .on("add", this.fileAdded.bind(this))
      .on("change", this.fileChanged.bind(this))
      .on("unlink", this.fileUnlink.bind(this))
      .once("ready", () => {
        this.state = "ready";
        this.queueTestRun();
      });
  }

  stop() {
    this.watcher.close();
  }

  queueTestRun() {
    if (this.state === "stopped") {
      return;
    }

    if (this.testTimer) {
      this.debug("resetting test timer.");
      clearTimeout(this.testTimer);
    }

    this.testTimer = setTimeout(() => this.runTests(), 500);
  }

  fileAdded(path) {
    this.debug("added", path);
    // TODO: dedupe relations then call this.sourceGraph.addFileFromPath(resolvedPath)
    this.queueTestRun();
  }

  fileChanged(path) {
    this.debug("changed", path);
    // TODO: find the file in the source graph and reload contents and relations
    this.queueTestRun();
  }

  fileUnlink(path) {
    // TODO: remove the file from the source graph and remove the outgoing relations
    this.debug("unlinked", path);
    this.queueTestRun();
  }

  async runTests() {
    if (!process.env.DEBUG) {
      process.stdout.write("\x1B[2J");
    }

    console.log("Running tests at", new Date());

    const relatedTestFiles = await findTestFilesToRun(
      this.sourceGraph,
      this.gitClient
    );

    await this.mochaWorker.runTests(relatedTestFiles);
  }
};
