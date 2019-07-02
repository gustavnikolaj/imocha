const path = require("path");

module.exports = listDirtyFilesInGitRepo;
module.exports.runShellCommand = require("./runShellCommand");

async function listDirtyFilesInGitRepo(gitDir) {
  // This allows us to overwrite the runShellCommand module in tests. It's a
  // little wacky, so we might want to reconsider this pattern...
  const { runShellCommand } = module.exports;

  const { error, stdout } = await runShellCommand(
    "git status --porcelain --untracked-files=all"
  );

  if (error) {
    throw new Error("Could not list files...");
  }

  const lines = stdout
    .split("\n")
    .filter(line => line.length > 0)
    .map(line => line.slice(3))
    .map(line => path.resolve(gitDir, line));

  return lines;
}
