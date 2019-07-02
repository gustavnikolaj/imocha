const chokidar = require("chokidar");
const EventEmitter = require("events").EventEmitter;
const { resolve } = require("path");
const listDirtyFilesInGitRepo = require("./listDirtyFilesInGitRepo");

const findFilesMochaWouldRun = require("./findFilesMochaWouldRun");

module.exports = class MochaWatch extends EventEmitter {
  constructor(cwd, sourceGraph, mochaWorker, mochaOpts) {
    super();
    this.cwd = cwd;
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

  async findTestFilesToRun() {
    const dirtyFiles = await listDirtyFilesInGitRepo(this.cwd);
    const dirtySourceFiles = dirtyFiles.reduce((files, path) => {
      const result = this.sourceGraph.query({ type: "file", path });

      if (result) {
        files.push(path);
      }

      return files;
    }, []);

    const filesToProcess = new Set(dirtySourceFiles);
    const processedFiles = new Set();
    const relatedTestFiles = new Set();

    while (filesToProcess.size > 0) {
      for (const path of filesToProcess.keys()) {
        filesToProcess.delete(path);
        if (processedFiles.has(path)) {
          continue;
        }
        processedFiles.add(path);

        const sourceFile = this.sourceGraph.query({ type: "file", path });

        if (sourceFile.isTestFile) {
          relatedTestFiles.add(path);
          // We don't need to look for relations to the source files. If they are
          // changed they need to be run.
          // XXX: Don't skip this - it might be that the file was matched as a test file by default.
          // continue;
        }

        for (const { from: relatedFile } of sourceFile.incomingRelations) {
          filesToProcess.add(relatedFile);
        }
      }
    }

    return [...relatedTestFiles];
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
