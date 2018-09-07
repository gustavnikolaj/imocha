const expect = require("unexpected");
const MochaWatch = require("../lib/MochaWatch");

const noop = () => {};

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
    it('should ignore calls if "stopped"', async () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      const calls = [];
      mochaWatch.queueFile = (...args) => calls.push(args);

      await mochaWatch.fileChanged();

      expect(calls, "to be empty");
    });

    it("should reload an existing file", async () => {
      const reloadCalls = [];
      const fakeFile = {
        reload: (...args) => reloadCalls.push(args)
      };
      const sourceGraph = createMockSourceGraph({
        query: () => fakeFile
      });
      const mochaWatch = new MochaWatch(null, null, sourceGraph);
      mochaWatch.state = "ready";

      await mochaWatch.fileChanged("/path/to/file");

      expect(reloadCalls, "not to be empty");
      expect(mochaWatch.watcherQueuedFiles, "to be empty");
      clearTimeout(mochaWatch.testTimer);
    });

    it("should queue a new file", async () => {
      const sourceGraph = createMockSourceGraph();
      const mochaWatch = new MochaWatch(null, null, sourceGraph);
      mochaWatch.state = "ready";

      await mochaWatch.fileChanged("/path/to/file");

      expect(mochaWatch.watcherQueuedFiles, "to contain", "/path/to/file");
      clearTimeout(mochaWatch.testTimer);
    });
  });

  describe("#fileUnlink", () => {
    it('should ignore calls if "stopped"', async () => {
      const mochaWatch = new MochaWatch();
      mochaWatch.state = "stopped";

      const calls = [];
      mochaWatch.queueFile = (...args) => calls.push(args);

      await mochaWatch.fileUnlink();

      expect(calls, "to be empty");
    });

    it("should remove an existing file", async () => {
      const removeCalls = [];
      const fakeFile = {
        remove: (...args) => removeCalls.push(args)
      };
      const sourceGraph = createMockSourceGraph({
        query: () => fakeFile
      });
      const mochaWatch = new MochaWatch(null, null, sourceGraph);
      mochaWatch.state = "ready";

      await mochaWatch.fileUnlink("/path/to/file");

      expect(removeCalls, "not to be empty");
      expect(mochaWatch.watcherQueuedFiles, "to be empty");
      clearTimeout(mochaWatch.testTimer);
    });
  });

  describe("#flushQueuedFiles", () => {
    it("should recalculate the files run by mocha", async () => {
      const program = {
        args: [],
        compilers: [],
        exclude: [],
        file: []
      };
      const setTestFilePathsCalls = [];
      const sourceGraph = createMockSourceGraph({
        setTestFilePaths: (...args) => setTestFilePathsCalls.push(args)
      });
      const mochaWatch = new MochaWatch(null, null, sourceGraph, null, program);

      await mochaWatch.flushQueuedFiles();

      expect(setTestFilePathsCalls, "to have length", 1);
    });

    it("should process any queued files", async () => {
      const program = {
        args: [],
        compilers: [],
        exclude: [],
        file: []
      };
      const addFileFromPathCalls = [];
      const sourceGraph = createMockSourceGraph({
        addFileFromPath: (...args) => addFileFromPathCalls.push(args)
      });
      const mochaWatch = new MochaWatch(null, null, sourceGraph, null, program);
      mochaWatch.watcherQueuedFiles = [
        "/path/to/file1",
        "/path/to/file2",
        "/path/to/file3"
      ];

      await mochaWatch.flushQueuedFiles();

      expect(addFileFromPathCalls, "to equal", [
        ["/path/to/file1"],
        ["/path/to/file2"],
        ["/path/to/file3"]
      ]);
      expect(mochaWatch.watcherQueuedFiles, "to be empty");
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
        mochaWatch.testTimer = setTimeout(() => {}, 2000);

        const calls = [];
        mochaWatch.debug = (...args) => calls.push(args);

        mochaWatch.queueTestRun();

        expect(calls, "to equal", [["resetting test timer."]]);
        expect(mochaWatch.testTimer, "not to be null");
        clearTimeout(mochaWatch.testTimer);
      });
    });
  });
});
