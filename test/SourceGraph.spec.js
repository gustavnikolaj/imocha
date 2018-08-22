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

      await sourceGraph.populate();

      return expect(sourceGraph, "to satisfy", {
        files: [
          { path: path.resolve(fixturePath, "foo.js") },
          { path: path.resolve(fixturePath, "bar.js") },
          { path: path.resolve(fixturePath, "test/bar.spec.js") }
        ],
        relations: [
          {
            from: path.resolve(fixturePath, "bar.js"),
            to: path.resolve(fixturePath, "foo.js")
          },
          {
            from: path.resolve(fixturePath, "test/bar.spec.js"),
            to: path.resolve(fixturePath, "bar.js")
          }
        ]
      });
    });

    it("should list incoming relations", async () => {
      const fixturePath = resolveFixture("simple");
      const sourceGraph = new SourceGraph(fixturePath);

      await sourceGraph.populate();

      const file = sourceGraph.query({
        type: "file",
        path: path.resolve(fixturePath, "foo.js")
      });

      return expect(file.incomingRelations, "to satisfy", [
        { from: path.resolve(fixturePath, "bar.js") }
      ]);
    });
  });
});
