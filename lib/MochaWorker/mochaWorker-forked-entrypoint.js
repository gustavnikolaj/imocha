const Mocha = require("mocha");

function main() {
  const mocha = new Mocha();

  for (const testFile of process.argv.slice(2)) {
    mocha.addFile(testFile);
  }

  mocha.run(failures => {
    process.exitCode = failures ? Math.min(failures, 255) : 0;
  });
}

main();
