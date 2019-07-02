const expect = require("unexpected");
const listDirtyFilesInGitRepo = require("../lib/listDirtyFilesInGitRepo");

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
});
