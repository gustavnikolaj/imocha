const chokidar = require("chokidar");
const EventEmitter = require("events").EventEmitter;
const { resolve } = require("path");

const findTestFilesToRun = require("./find-test-files-to-run");
const findFilesMochaWouldRun = require("./find-files-mocha-would-run");

module.exports = class MochaWatch extends EventEmitter {
  constructor(cwd, gitClient, sourceGraph, mochaWorker, mochaOpts) {
    super();
    this.cwd = cwd;
    this.gitClient = gitClient;
    this.sourceGraph = sourceGraph;
    this.mochaWorker = mochaWorker;
    this.mochaOpts = mochaOpts;

    this.state = "stopped";

    this.watcher = null;
    this.watcherQueuedFiles = [];
    this.testTimer = null;
  }

  debug(...args) {
    this.emit("debug", ...args);
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

  findTestFilesToRun() {
    return findTestFilesToRun(this.sourceGraph, this.gitClient);
  }

  stop() {
    this.watcher.close();
  }

  queueFile(path) {
    this.watcherQueuedFiles.push(path);
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

    this.queueFile(path);

    this.queueTestRun();
  }

  async fileChanged(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("changed", path);
    path = resolve(this.cwd, path);

    const file = this.sourceGraph.query({ type: "file", path });
    if (file) {
      await file.reload();
    } else {
      this.queueFile(path);
    }

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

  async flushQueuedFiles() {
    const testFiles = await findFilesMochaWouldRun(this.mochaOpts);
    this.sourceGraph.setTestFilePaths(testFiles);

    const filesToProcess = this.watcherQueuedFiles;
    this.watcherQueuedFiles = []; // record the queue was processed

    this.debug("flushQueuedFiles", ...filesToProcess);

    for (const path of filesToProcess) {
      await this.sourceGraph.addFileFromPath(path);
    }
  }

  async runTests() {
    await this.flushQueuedFiles();

    const testFilesToRun = await this.findTestFilesToRun();

    this.emit("run begin");

    const result = await this.mochaWorker.runTests(testFilesToRun);

    this.emit("run complete", result);
  }
};
