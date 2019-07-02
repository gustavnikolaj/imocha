const expect = require("unexpected");
const resolveRequire = require("../lib/resolve-require");
const path = require("path");

const fixturesDir = path.resolve(__dirname, "../fixtures/resolve-require");

describe("resolveRequire", () => {
  it("should be a function", () => {
    expect(resolveRequire, "to be a function");
  });

  it("should throw NYI error when attempting to resolve a module", () => {
    return expect(
      async () => resolveRequire(__filename, "unexpected"),
      "to be rejected with",
      "Module resolution not yet implemented"
    );
  });

  it("should find foo.js when asking for ./foo", async () => {
    return expect(
      await resolveRequire(fixturesDir, "./foo"),
      "to equal",
      path.resolve(fixturesDir, "foo.js")
    );
  });

  it("should find bar/bar.js via bar/package.json when asking for ./bar", async () => {
    return expect(
      await resolveRequire(fixturesDir, "./bar"),
      "to equal",
      path.resolve(fixturesDir, "bar/bar.js")
    );
  });

  it("should find baz/index.js when asking for ./baz", async () => {
    return expect(
      await resolveRequire(fixturesDir, "./baz"),
      "to equal",
      path.resolve(fixturesDir, "baz/index.js")
    );
  });
});
