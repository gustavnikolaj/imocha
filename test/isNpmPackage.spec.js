const expect = require("unexpected");
const isNpmPackage = require("../lib/isNpmPackage");

describe("isNpmPackage", () => {
  it("should be a function", () => {
    expect(isNpmPackage, "to be a function");
  });

  it("should not consider a relative path a package", () => {
    expect(isNpmPackage("../lib/isNpmPackage"), "to be false");
  });

  it("should not consider an absolute path a package", () => {
    expect(isNpmPackage("/root/lib/isNpmPackage"), "to be false");
  });

  it("should identify `unexpected` as a package", () => {
    expect(isNpmPackage("unexpected"), "to be true");
  });

  it("should identify `@gustavnikolaj/async-main-wrap` as a package", () => {
    expect(isNpmPackage("@gustavnikolaj/async-main-wrap"), "to be true");
  });

  it("should identify a path into a package as a package", () => {
    expect(isNpmPackage("unexpected/some/sub/library"), "to be true");
  });
});
