const expect = require("unexpected");
const findRelationsInSourceCode = require("../lib/findRelationsInSourceCode");

describe("findRelationsInSourceCode", () => {
  it("should be a function", () => {
    expect(findRelationsInSourceCode, "to be a function");
  });

  it("should return an empty list of required files", () => {
    expect(
      findRelationsInSourceCode(`
        module.exports = function () {};
      `),
      "to equal",
      []
    );
  });

  it("should return a list of required files", () => {
    expect(
      findRelationsInSourceCode(`
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
      () => findRelationsInSourceCode(source),
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
      () => findRelationsInSourceCode(source),
      "to throw",
      "Cannot parse require calls with more than one argument.\n\n    " +
        "\n      require('./some', '-file');\n    "
    );
  });

  it("should return a list of imported files", () => {
    expect(
      findRelationsInSourceCode(`
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
        findRelationsInSourceCode(`
          import bar from './bar';
          import foo;
        `),
      "to throw",
      "Unexpected token (3:20)"
    );
  });

  it("should support object/rest spread syntax", () => {
    expect(
      findRelationsInSourceCode(`
        module.exports = { ...process.env, MY_ENV: false };
      `),
      "to equal",
      []
    );
  });
});
