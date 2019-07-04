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

    const files = findFilesMochaWouldRun(this.mochaOpts);
    const populationPromise = this.sourceGraph.populate(files);

    this.watcher
      .on("add", this.fileAdded.bind(this))
      .on("change", this.fileChanged.bind(this))
      .on("unlink", this.fileUnlink.bind(this))
      .once("ready", () =>
        populationPromise.then(() => {
          this.state = "ready";
          this.queueTestRun();
        })
      );

    populationPromise.catch(err => {
      console.error(err);
      process.exit(1);
    });
  }

  findTestFilesToRun() {
    return listDirtyFilesInGitRepo(this.cwd)
      .catch(err => {
        if (err.code === "IMOCHA_NO_GIT_REPO") {
          // Consider all test files dirty if we are not in a git repo. This will
          // result in executing all test files whenever any javascript file in
          // the folder changes.
          return findFilesMochaWouldRun(this.mochaOpts);
        } else {
          throw err;
        }
      })
      .then(dirtyFiles => {
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
      });
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

  fileAdded(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("added", path);
    path = resolve(this.cwd, path);

    this.queueFile(path);

    this.queueTestRun();
  }

  fileChanged(path) {
    if (this.state === "stopped") {
      return;
    }
    this.debug("changed", path);
    path = resolve(this.cwd, path);

    const file = this.sourceGraph.query({ type: "file", path });
    if (file) {
      file.reload().then(() => this.queueTestRun());
    } else {
      this.queueFile(path);
      this.queueTestRun();
    }
  }

  fileUnlink(path) {
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

  flushQueuedFiles() {
    const testFiles = findFilesMochaWouldRun(this.mochaOpts);
    this.sourceGraph.setTestFilePaths(testFiles);

    const filesToProcess = this.watcherQueuedFiles;
    this.watcherQueuedFiles = []; // record the queue was processed

    this.debug("flushQueuedFiles", ...filesToProcess);

    return Promise.all(
      filesToProcess.map(path => this.sourceGraph.addFileFromPath(path))
    );
  }

  runTests() {
    return this.flushQueuedFiles()
      .then(() => this.findTestFilesToRun())
      .then(testFilesToRun => {
        this.emit("run begin");
        return this.mochaWorker.runTests(testFilesToRun);
      })
      .then(result => {
        this.emit("run complete", result);
      });
  }
};
