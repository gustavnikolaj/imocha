const expect = require("unexpected");
const MochaWatch = require("../lib/MochaWatch");

const noop = () => {};

function createMockMochaWorker(config = {}) {
  return {
    runTests: config.runTests || noop
  };
}

function createMockSourceGraph(config = {}) {
  return {
    addFileFromPath: config.addFileFromPath || noop,
    query: config.query || noop,
    setTestFilePaths: config.setTestFilePaths || noop
  };
}

describe("MochaWatch", () => {
  it("should be a constructor", () => {
    const mochaWatch = new MochaWatch();
    expect(mochaWatch, "to be a", MochaWatch);
  });

  it('should be in the "stopped" state', () => {
    const mochaWatch = new MochaWatch();
    expect(mochaWatch.state, "to equal", "stopped");
  });

  describe("#fileAdded", () => {
    it('should ignore calls if "stopped"', () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      const calls = [];
      mochaWatch.queueFile = (...args) => calls.push(args);

      mochaWatch.fileAdded();

      expect(calls, "to be empty");
    });

    it("should queue a file", () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "ready";

      mochaWatch.fileAdded("/path/to/file");

      expect(mochaWatch.watcherQueuedFiles, "to contain", "/path/to/file");
      clearTimeout(mochaWatch.testTimer);
    });
  });

  describe("#fileChanged", () => {
    it('should ignore calls if "stopped"', () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      const calls = [];
      mochaWatch.queueFile = (...args) => calls.push(args);

      mochaWatch.fileChanged();

      expect(calls, "to be empty");
    });

    it("should reload an existing file", () => {
      const reloadCalls = [];
      const fakeFile = {
        reload: (...args) =>
          Promise.resolve().then(() => reloadCalls.push(args))
      };
      const sourceGraph = createMockSourceGraph({
        query: () => fakeFile
      });
      const mochaWatch = new MochaWatch(null, sourceGraph);
      mochaWatch.state = "ready";

      return expect(
        () => mochaWatch.fileChanged("/path/to/file"),
        "to be fulfilled"
      ).then(() => {
        expect(reloadCalls, "not to be empty");
        expect(mochaWatch.watcherQueuedFiles, "to be empty");
        clearTimeout(mochaWatch.testTimer);
      });
    });

    it("should queue a new file", () => {
      const sourceGraph = createMockSourceGraph();
      const mochaWatch = new MochaWatch(null, sourceGraph);
      mochaWatch.state = "ready";

      mochaWatch.fileChanged("/path/to/file");

      expect(mochaWatch.watcherQueuedFiles, "to contain", "/path/to/file");
      clearTimeout(mochaWatch.testTimer);
    });
  });

  describe("#fileUnlink", () => {
    it('should ignore calls if "stopped"', () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      const calls = [];
      mochaWatch.queueFile = (...args) => calls.push(args);

      mochaWatch.fileUnlink();

      expect(calls, "to be empty");
    });

    it("should remove an existing file", () => {
      const removeCalls = [];
      const fakeFile = {
        remove: (...args) => removeCalls.push(args)
      };
      const sourceGraph = createMockSourceGraph({
        query: () => fakeFile
      });
      const mochaWatch = new MochaWatch(null, sourceGraph);
      mochaWatch.state = "ready";

      mochaWatch.fileUnlink("/path/to/file");

      expect(removeCalls, "not to be empty");
      expect(mochaWatch.watcherQueuedFiles, "to be empty");
      clearTimeout(mochaWatch.testTimer);
    });
  });

  describe("#flushQueuedFiles", () => {
    it("should recalculate the files run by mocha", () => {
      const mochaOpts = {
        extension: ["js"]
      };
      const setTestFilePathsCalls = [];
      const sourceGraph = createMockSourceGraph({
        setTestFilePaths: (...args) => setTestFilePathsCalls.push(args)
      });
      const mochaWatch = new MochaWatch(null, sourceGraph, null, mochaOpts);

      return expect(
        () => mochaWatch.flushQueuedFiles(),
        "to be fulfilled"
      ).then(() => {
        return expect(setTestFilePathsCalls, "to have length", 1);
      });
    });

    it("should process any queued files", () => {
      const mochaOpts = {
        extension: ["js"]
      };
      const addFileFromPathCalls = [];
      const sourceGraph = createMockSourceGraph({
        addFileFromPath: (...args) => addFileFromPathCalls.push(args)
      });
      const mochaWatch = new MochaWatch(null, sourceGraph, null, mochaOpts);
      mochaWatch.watcherQueuedFiles = [
        "/path/to/file1",
        "/path/to/file2",
        "/path/to/file3"
      ];

      return expect(() => mochaWatch.flushQueuedFiles(), "to be fulfilled")
        .then(() => {
          return expect(addFileFromPathCalls, "to equal", [
            ["/path/to/file1"],
            ["/path/to/file2"],
            ["/path/to/file3"]
          ]);
        })
        .then(() => {
          return expect(mochaWatch.watcherQueuedFiles, "to be empty");
        });
    });
  });

  describe("#queueFile", () => {
    it("should add the file path", () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.queueFile("/path/to/file");

      expect(mochaWatch.watcherQueuedFiles, "to contain", "/path/to/file");
    });
  });

  describe("#queueTestRun", () => {
    it('should ignore calls if "stopped"', () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      mochaWatch.queueTestRun();

      expect(mochaWatch.testTimer, "to be null");
    });

    it("should queue a test run", () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "ready";

      mochaWatch.queueTestRun();

      expect(mochaWatch.testTimer, "not to be null");
      clearTimeout(mochaWatch.testTimer);
    });

    describe("when a timer was previously set", () => {
      it("should reschedule the timer and queue a test run", () => {
        const mochaWatch = new MochaWatch();
        mochaWatch.state = "ready";
        const myTimer = setTimeout(() => {}, 2000);
        mochaWatch.testTimer = myTimer;

        mochaWatch.queueTestRun();

        expect(mochaWatch.testTimer, "not to be", myTimer);
        clearTimeout(mochaWatch.testTimer);
      });
    });
  });

  describe("#runTests", () => {
    it("should flush queued files", () => {
      const mochaWorker = createMockMochaWorker();
      const mochaWatch = new MochaWatch(null, null, mochaWorker);
      mochaWatch.state = "ready";
      mochaWatch.findTestFilesToRun = () => Promise.resolve([]);

      const calls = [];
      mochaWatch.flushQueuedFiles = (...args) =>
        Promise.resolve().then(() => calls.push(args));

      return expect(() => mochaWatch.runTests(), "to be fulfilled").then(() => {
        return expect(calls, "to have length", 1);
      });
    });

    it("should trigger the mocha worker with found test files", () => {
      const calls = [];
      const mochaWorker = createMockMochaWorker({
        runTests: (...args) => calls.push(args)
      });
      const mochaWatch = new MochaWatch(null, null, mochaWorker);
      mochaWatch.state = "ready";
      mochaWatch.flushQueuedFiles = () => Promise.resolve();
      mochaWatch.findTestFilesToRun = () =>
        Promise.resolve(["/path/to/file1", "/path/to/file2", "/path/to/file3"]);

      return expect(() => mochaWatch.runTests(), "to be fulfilled").then(() => {
        return expect(calls, "to equal", [
          [["/path/to/file1", "/path/to/file2", "/path/to/file3"]]
        ]);
      });
    });
  });
});
