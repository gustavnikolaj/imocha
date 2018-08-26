const chokidar = require("chokidar");
const findTestFilesToRun = require("./findTestFilesToRun");
const findFilesMochaWouldRun = require("./findFilesMochaWouldRun");
const { resolve } = require("path");

module.exports = class MochaWatch {
  constructor(cwd, gitClient, sourceGraph, mochaWorker, program) {
    this.cwd = cwd;
    this.gitClient = gitClient;
    this.sourceGraph = sourceGraph;
    this.mochaWorker = mochaWorker;
    this.program = program;

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

  async fileAdded(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("added", path);
    path = resolve(this.cwd, path);

    const testFiles = await findFilesMochaWouldRun(this.program);

    // If the added file is a test file we need to repopulate the sourceGraph,
    // otherwise we can just add the file.
    if (testFiles.includes(path)) {
      await this.sourceGraph.populate(testFiles);
    } else {
      await this.sourceGraph.addFileFromPath(path);
    }

    this.queueTestRun();
  }

  async fileChanged(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("changed", path);
    path = resolve(this.cwd, path);
    const file = this.sourceGraph.query({ type: "file", path });

    if (!file) {
      throw new Error(`Change event on unknown file "${path}".`);
    }

    await file.reload();

    this.queueTestRun();
  }

  async fileUnlink(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("unlinked", path);

    path = resolve(this.cwd, path);
    const file = this.sourceGraph.query({ type: "file", path });

    if (file) {
      file.remove();
    }

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
