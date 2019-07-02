const { exec } = require("child_process");

module.exports = function runShellCommand(command, options = {}) {
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
