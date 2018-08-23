const expect = require("unexpected");
const GitClient = require("../lib/GitClient");

describe("GitClient", () => {
  it("should be a constructor", () => {
    const gitClient = new GitClient();
    expect(gitClient, "to be a", GitClient);
  });

  describe("#exec", () => {
    it("should delegate calls to runShellCommand ", async () => {
      const gitClient = new GitClient("/fakeroot");

      const calls = [];

      gitClient.runShellCommand = (...args) => calls.push(args);

      await gitClient.exec("foo");

      return expect(calls, "to equal", [["foo", { cwd: "/fakeroot" }]]);
    });
  });

  describe("#listDirtyFiles", () => {
    it("should list dirty files", () => {
      const gitClient = new GitClient("/fakeroot");

      gitClient.runShellCommand = async () => {
        return {
          err: null,
          stdout: ["?? foo.js", "?? bar.js", ""].join("\n")
        };
      };

      return expect(() => gitClient.listDirtyFiles(), "to be fulfilled with", [
        "/fakeroot/foo.js",
        "/fakeroot/bar.js"
      ]);
    });
  });
});
