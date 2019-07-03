const expect = require("unexpected");
const resolveRequire = require("../lib/resolveRequire");
const path = require("path");

const fixturesDir = path.resolve(__dirname, "../fixtures/resolveRequire");

describe("resolveRequire", () => {
  it("should be a function", () => {
    expect(resolveRequire, "to be a function");
  });

  it("should throw NYI error when attempting to resolve a module", () => {
    return expect(
      () => resolveRequire(__filename, "unexpected"),
      "to throw",
      "Module resolution not yet implemented"
    );
  });

  it("should find foo.js when asking for ./foo", () => {
    return expect(
      resolveRequire(fixturesDir, "./foo"),
      "to equal",
      path.resolve(fixturesDir, "foo.js")
    );
  });

  it("should find bar/bar.js via bar/package.json when asking for ./bar", () => {
    return expect(
      resolveRequire(fixturesDir, "./bar"),
      "to equal",
      path.resolve(fixturesDir, "bar/bar.js")
    );
  });

  it("should find baz/index.js when asking for ./baz", () => {
    return expect(
      resolveRequire(fixturesDir, "./baz"),
      "to equal",
      path.resolve(fixturesDir, "baz/index.js")
    );
  });

  it("should find testdata.json when asking for testdata.json", () => {
    return expect(
      resolveRequire(fixturesDir, "./testdata.json"),
      "to equal",
      path.resolve(fixturesDir, "testdata.json")
    );
  });
});
