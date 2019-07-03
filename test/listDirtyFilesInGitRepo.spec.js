const expect = require("unexpected");
const listDirtyFilesInGitRepo = require("../lib/listDirtyFilesInGitRepo");
const {
  parseGitStatusOutput,
  prepareGitError,
  getGitStatus: originalGetGitStatus
} = listDirtyFilesInGitRepo;

describe("listDirtyFilesInGitRepo", () => {
  afterEach(() => {
    listDirtyFilesInGitRepo.getGitStatus = originalGetGitStatus;
  });

  it("should list dirty files", () => {
    listDirtyFilesInGitRepo.getGitStatus = () =>
      Promise.resolve("?? foo.js\n?? bar.js\n");

    return expect(
      () => listDirtyFilesInGitRepo("/fakeroot"),
      "to be fulfilled with",
      ["/fakeroot/foo.js", "/fakeroot/bar.js"]
    );
  });

  it("should list dirty files when the first is modified", () => {
    listDirtyFilesInGitRepo.getGitStatus = () =>
      Promise.resolve(" M package.json\n?? yarn.lock\n");

    return expect(
      () => listDirtyFilesInGitRepo("/fakeroot"),
      "to be fulfilled with",
      ["/fakeroot/package.json", "/fakeroot/yarn.lock"]
    );
  });

  it("should return an error when not in a git dir", () => {
    return expect(
      () => listDirtyFilesInGitRepo("/tmp"),
      "to be rejected with",
      {
        code: "IMOCHA_NO_GIT_REPO"
      }
    );
  });

  describe("parseGitStatusOutput", () => {
    it("a single modified file", () => {
      const output = " M file.js\n";
      expect(parseGitStatusOutput(output), "to equal", ["file.js"]);
    });

    it("a single modified and staged file", () => {
      const output = "M  file.js\n";
      expect(parseGitStatusOutput(output), "to equal", ["file.js"]);
    });

    it("a single new file", () => {
      const output = "?? file.js\n";
      expect(parseGitStatusOutput(output), "to equal", ["file.js"]);
    });

    it("a single deleted file", () => {
      const output = "D  file.js\n";
      expect(parseGitStatusOutput(output), "to equal", ["file.js"]);
    });

    it("all together now", () => {
      const output = " M fileA.js\nM  fileB.js\n?? fileC.js\nD  fileD.js\n";
      expect(parseGitStatusOutput(output), "to equal", [
        "fileA.js",
        "fileB.js",
        "fileC.js",
        "fileD.js"
      ]);
    });
  });

  describe("prepareGitError", () => {
    it("should return an error as is when it is not matching", () => {
      const err = new Error("Test Error");
      expect(prepareGitError(err), "to be", err);
    });

    it("should return a no git repo error", () => {
      const err = {
        message:
          "Command failed: git status --porcelain --untracked-files=all\nfatal: not a git repository (or any of the parent directories): .git\n",
        killed: false,
        code: 128,
        signal: null,
        cmd: "git status --porcelain --untracked-files=all"
      };

      expect(prepareGitError(err), "to satisfy", {
        message: "Not a git repo.",
        code: "IMOCHA_NO_GIT_REPO"
      });
    });

    it("should return a no git repo error 2", () => {
      const err = {
        message:
          "Command failed: git status --porcelain --untracked-files=all\nfatal: Not a git repository (or any of the parent directories): .git\n",
        killed: false,
        code: 128,
        signal: null,
        cmd: "git status --porcelain --untracked-files=all"
      };

      expect(prepareGitError(err), "to satisfy", {
        message: "Not a git repo.",
        code: "IMOCHA_NO_GIT_REPO"
      });
    });
  });
});
