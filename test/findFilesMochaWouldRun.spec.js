const expect = require("unexpected");
const path = require("path");
const findFilesMochaWouldRun = require("../lib/findFilesMochaWouldRun");

describe("findFilesMochaWouldRun", () => {
  it("should error when the default spec cannot be found", () => {
    process.chdir(__dirname);

    expect(
      () => {
        findFilesMochaWouldRun();
      },
      "to throw",
      'Cannot find any files matching pattern "test"'
    );
  });

  it("should error when a specific spec file cannot be found", () => {
    process.chdir(__dirname);

    expect(
      () => {
        findFilesMochaWouldRun({
          spec: ["foo.js"]
        });
      },
      "to throw",
      'Cannot find any files matching pattern "foo.js"'
    );
  });

  it("should return any files found sorted", () => {
    process.chdir(__dirname);

    expect(
      findFilesMochaWouldRun({
        spec: ["listDirtyFilesInGitRepo.spec.js", "isNpmPackage.spec.js"],
        sort: true
      }),
      "to equal",
      [
        path.join(__dirname, "isNpmPackage.spec.js"),
        path.join(__dirname, "listDirtyFilesInGitRepo.spec.js")
      ]
    );
  });
});
