const runShellCommand = require("./runShellCommand");
const path = require("path");

module.exports = class GitClient {
  constructor(cwd) {
    this.cwd = cwd;
    this.runShellCommand = runShellCommand;
  }

  async exec(command) {
    return this.runShellCommand(command, { cwd: this.cwd });
  }

  async listDirtyFiles() {
    const { error, stdout } = await this.exec("git status --porcelain");

    if (error) {
      throw new Error("Could not list files...");
    }

    const lines = stdout
      .split("\n")
      .filter(line => line.length > 0)
      .map(line => line.slice(3))
      .map(line => path.resolve(this.cwd, line));

    return lines;
  }
};
