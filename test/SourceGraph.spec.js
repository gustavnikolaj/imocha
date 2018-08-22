const expect = require("unexpected");
const SourceGraph = require("../lib/SourceGraph");
const path = require("path");

const resolveFixture = name => path.resolve(__dirname, "../fixtures", name);

describe("SourceGraph", () => {
  it("should be a constructor", () => {
    const sourceGraph = new SourceGraph();

    expect(sourceGraph, "to be an", SourceGraph);
  });

  describe("fixtures", () => {
    it("should load the simple fixture", async () => {
      const fixturePath = resolveFixture("simple");
      const sourceGraph = new SourceGraph(fixturePath);

      await sourceGraph.load();

      return expect(sourceGraph, "to satisfy", {
        files: [
          { path: path.resolve(fixturePath, "bar.js") },
          { path: path.resolve(fixturePath, "foo.js") }
        ],
        relations: [
          {
            from: path.resolve(fixturePath, "bar.js"),
            to: path.resolve(fixturePath, "foo.js")
          }
        ]
      });
    });
  });
});
