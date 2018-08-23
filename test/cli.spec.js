const expect = require("unexpected");
const cliMain = require("../lib/cli");

describe("cli", () => {
  it("should be a function", () => {
    expect(cliMain, "to be a function");
  });
});
