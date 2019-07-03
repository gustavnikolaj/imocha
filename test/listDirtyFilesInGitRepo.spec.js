const expect = require("unexpected");
const listDirtyFilesInGitRepo = require("../lib/listDirtyFilesInGitRepo");
const path = require("path");
const { runShellCommand } = listDirtyFilesInGitRepo;

describe("listDirtyFilesInGitRepo", () => {
  let originalRunShellCommand = listDirtyFilesInGitRepo.runShellCommand;

  afterEach(() => {
    listDirtyFilesInGitRepo.runShellCommand = originalRunShellCommand;
  });

  it("should list dirty files", () => {
    listDirtyFilesInGitRepo.runShellCommand = async () => {
      return {
        err: null,
        stdout: "?? foo.js\n?? bar.js\n"
      };
    };

    return expect(
      () => listDirtyFilesInGitRepo("/fakeroot"),
      "to be fulfilled with",
      ["/fakeroot/foo.js", "/fakeroot/bar.js"]
    );
  });

  it("should list dirty files when the first is modified", () => {
    listDirtyFilesInGitRepo.runShellCommand = async () => {
      return {
        err: null,
        stdout: " M package.json\n?? yarn.lock\n"
      };
    };

    return expect(
      () => listDirtyFilesInGitRepo("/fakeroot"),
      "to be fulfilled with",
      ["/fakeroot/package.json", "/fakeroot/yarn.lock"]
    );
  });
  describe("runShellCommand", () => {
    it("should be a function", () => {
      expect(runShellCommand, "to be a function");
    });

    it("should run a simple echo command", () => {
      return expect(() => runShellCommand("echo foo"), "to be fulfilled with", {
        error: null,
        stderr: "",
        stdout: "foo\n"
      });
    });

    describe("options.cwd", () => {
      it("should set cwd to __dirname", () => {
        return expect(
          () => runShellCommand("pwd", { cwd: __dirname }),
          "to be fulfilled with",
          {
            error: null,
            stderr: "",
            stdout: `${__dirname}\n`
          }
        );
      });

      it("should set cwd to the parent of __dirname", () => {
        const parentDir = path.resolve(__dirname, "..");
        return expect(
          () => runShellCommand("pwd", { cwd: parentDir }),
          "to be fulfilled with",
          {
            error: null,
            stderr: "",
            stdout: `${parentDir}\n`
          }
        );
      });

      it("should default to process.cwd()", () => {
        return expect(() => runShellCommand("pwd"), "to be fulfilled with", {
          error: null,
          stderr: "",
          stdout: `${process.cwd()}\n`
        });
      });
    });
  });
});
