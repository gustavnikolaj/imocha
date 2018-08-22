const expect = require("unexpected");
const findCommonJsRequireCalls = require("../lib/findCommonJsRequireCalls");

describe("findCommonJsRequireCalls", () => {
  it("should be a function", () => {
    expect(findCommonJsRequireCalls, "to be a function");
  });

  it("should return an empty list of required files", () => {
    expect(
      findCommonJsRequireCalls(`
        module.exports = function () {};
      `),
      "to equal",
      []
    );
  });

  it("should return a list of required files", () => {
    expect(
      findCommonJsRequireCalls(`
        require('./another-file');
        module.exports = function () {};
      `),
      "to equal",
      ["./another-file"]
    );
  });

  it("should reject non literal arguments to require", () => {
    const source = `
      require('./some' + '-file');
    `;

    expect(
      () => findCommonJsRequireCalls(source),
      "to throw",
      "Can only parse require calls with literal values.\n\n    " +
        "require('./some' + '-file')"
    );
  });

  it("should reject multiple arguments to require", () => {
    const source = `
      require('./some', '-file');
    `;

    expect(
      () => findCommonJsRequireCalls(source),
      "to throw",
      "Cannot parse require calls with more than one argument.\n\n    " +
        "require('./some', '-file')"
    );
  });
});
