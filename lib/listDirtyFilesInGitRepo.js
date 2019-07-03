const path = require("path");
const { exec } = require("child_process");

function parseGitStatusOutput(output) {
  return output
    .split("\n")
    .filter(line => line.length > 0)
    .map(line => line.slice(3));
}

function prepareGitError(err) {
  if (err.code === 128 && err.message.indexOf("not a git repository") !== -1) {
    const noRepoError = new Error("Not a git repo.");
    noRepoError.code = "IMOCHA_NO_GIT_REPO";
    return noRepoError;
  }
  return err;
}

function getGitStatus(gitDir) {
  return new Promise((resolve, reject) => {
    try {
      exec(
        "git status --porcelain --untracked-files=all",
        { cwd: gitDir },
        (err, stdout) => {
          if (err) {
            return reject(prepareGitError(err));
          }
          return resolve(stdout);
        }
      );
    } catch (e) {
      return reject(e);
    }
  });
}

function listDirtyFilesInGitRepo(gitDir) {
  // Allows us to overwrite the method in tests.
  const { getGitStatus } = module.exports;

  return getGitStatus(gitDir).then(stdout =>
    parseGitStatusOutput(stdout).map(line => path.resolve(gitDir, line))
  );
}

module.exports = listDirtyFilesInGitRepo;
module.exports.getGitStatus = getGitStatus;
module.exports.prepareGitError = prepareGitError;
module.exports.parseGitStatusOutput = parseGitStatusOutput;
