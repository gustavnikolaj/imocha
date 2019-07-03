const expect = require("unexpected");
const EventEmitter = require("events");
const { resolve } = require("path");
const MochaWorker = require("../lib/MochaWorker");

const originalChildProcessSpawn = MochaWorker.childProcessSpawn;

describe("MochaWorker", () => {
  it("should be a constructor", () => {
    const mochaWorker = new MochaWorker();

    expect(mochaWorker, "to be a", MochaWorker);
  });

  it("should set instance variables", () => {
    const mochaWorker = new MochaWorker({ foo: true, bar: 1 }, [
      "--reporter",
      "dot",
      "a.spec.js",
      "b.spec.js"
    ]);

    expect(mochaWorker, "to exhaustively satisfy", {
      args: ["--reporter", "dot", "a.spec.js", "b.spec.js"],
      mochaOpts: { foo: true, bar: 1 },
      state: "stopped"
    });
  });

  describe("#generateArgs", () => {
    it("should take supplied args and add generated files", () => {
      const mochaWorker = new MochaWorker(
        {
          spec: ["a.spec.js", "b.spec.js"]
        },
        ["--reporter", "dot", "a.spec.js", "b.spec.js"]
      );

      expect(mochaWorker.generateArgs(["b.spec.js"]), "to equal", [
        "--reporter",
        "dot",
        "b.spec.js"
      ]);
    });

    it("should include any newly discovered files", () => {
      const mochaWorker = new MochaWorker(
        {
          spec: ["a.spec.js", "b.spec.js"]
        },
        ["--reporter", "dot", "a.spec.js", "b.spec.js"]
      );

      expect(mochaWorker.generateArgs(["c.spec.js"]), "to equal", [
        "--reporter",
        "dot",
        "c.spec.js"
      ]);
    });
  });

  describe("#runTests", () => {
    afterEach(() => {
      MochaWorker.childProcessSpawn = originalChildProcessSpawn;
    });

    it("should call spawn with the correct arguments", () => {
      const mochaWorker = new MochaWorker(
        {
          spec: ["a.spec.js", "b.spec.js"]
        },
        ["--reporter", "dot", "a.spec.js", "b.spec.js"]
      );
      mochaWorker.generateArgs = () => ["--reporter", "dot", "c.spec.js"];
      const calls = [];
      MochaWorker.childProcessSpawn = (...args) => {
        calls.push(args);
        throw new Error("ignore");
      };

      return expect(
        () => mochaWorker.runTests(["c.spec.js"]),
        "to be rejected"
      ).then(() => {
        expect(calls, "to satisfy", [
          [
            resolve(__dirname, "..", "node_modules", "mocha/bin/mocha"),
            ["--reporter", "dot", "c.spec.js"],
            {
              stdio: "inherit"
            }
          ]
        ]);
      });
    });

    it("should transition into the started state", () => {
      const mochaWorker = new MochaWorker(
        {
          spec: ["a.spec.js", "b.spec.js"]
        },
        ["--reporter", "dot", "a.spec.js", "b.spec.js"]
      );
      mochaWorker.generateArgs = () => ["--reporter", "dot", "c.spec.js"];
      let emitter;
      MochaWorker.childProcessSpawn = () => {
        emitter = new EventEmitter();
        return emitter;
      };

      const workerPromise = mochaWorker.runTests(["c.spec.js"]);

      return expect(mochaWorker, "to satisfy", {
        state: "started"
      }).finally(() => {
        emitter.emit("close");
        return workerPromise;
      });
    });
  });
});
