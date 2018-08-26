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
        "\n      require('./some' + '-file');\n    "
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
        "\n      require('./some', '-file');\n    "
    );
  });

  it("should return a list of imported files", () => {
    expect(
      findCommonJsRequireCalls(`
        import foo from './someFile'
        import './another-file';
        export default function () {};
      `),
      "to equal",
      ["./someFile", "./another-file"]
    );
  });

  it("should throw with invalid import sources", () => {
    expect(
      () =>
        findCommonJsRequireCalls(`
          import bar from './bar';
          import foo;
        `),
      "to throw",
      "Unexpected token (3:20)"
    );
  });
});
