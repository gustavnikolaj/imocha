const path = require("path");
const { exec } = require("child_process");

// TODO: Move runShellCommand into here. Take control and maybe fix #9 while
//       we're at it.

module.exports = async function listDirtyFilesInGitRepo(gitDir) {
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
};

module.exports.runShellCommand = function runShellCommand(
  command,
  options = {}
) {
  const cwd = options.cwd || process.cwd();

  return new Promise((resolve, reject) => {
    try {
      exec(command, { cwd }, (err, stdout, stderr) => {
        return resolve({ error: err, stdout, stderr });
      });
    } catch (e) {
      return reject(e);
    }
  });
};
