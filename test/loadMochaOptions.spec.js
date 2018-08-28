const expect = require("unexpected").clone();
const loadMochaOptions = require("../lib/loadMochaOptions");

expect.addAssertion(
  "<array> to yield options <object>",
  (expect, subject, value) => {
    return expect(
      loadMochaOptions([
        "/usr/bin/node",
        "/path/to/imocha/bin/imocha",
        ...subject
      ]),
      "to satisfy",
      value
    );
  }
);

describe("loadMochaOptions", () => {
  it("should be a function", () => {
    expect(loadMochaOptions, "to be a function");
  });

  it("should not throw on unknown options", () =>
    expect(
      ["--foo-bar", "--this-is-totally-not-a-mocha-argument"],
      "to yield options",
      {}
    ));

  it("should parse no args", () =>
    expect([], "to yield options", {
      args: []
    }));

  it("should parse simple pattern", () =>
    expect(["test/**/*.js"], "to yield options", {
      args: ["test/**/*.js"]
    }));

  it("should parse --recursive option", () =>
    expect(["--recursive"], "to yield options", {
      recursive: true,
      args: []
    }));

  it("should parse --watch option", () =>
    expect(["--watch"], "to yield options", {
      watch: true,
      args: []
    }));

  it("should parse -w option", () =>
    expect(["-w"], "to yield options", {
      watch: true,
      args: []
    }));

  it("should parse --grep option", () =>
    expect(["--grep", "foo"], "to yield options", {
      grep: "foo",
      args: []
    }));

  it("should parse -g option", () =>
    expect(["-g", "foo"], "to yield options", {
      grep: "foo",
      args: []
    }));

  it("should parse -f option", () =>
    expect(["-f", "foo"], "to yield options", {
      fgrep: "foo",
      args: []
    }));

  it("should parse --invert option", () =>
    expect(["--invert"], "to yield options", {
      invert: true,
      args: []
    }));

  it("should parse -i option", () =>
    expect(["-i"], "to yield options", {
      invert: true,
      args: []
    }));

  it("should parse --invert along with --grep option", () =>
    expect(["--invert", "--grep", "foo"], "to yield options", {
      invert: true,
      grep: "foo",
      args: []
    }));

  it("should parse --exclude option", () =>
    expect(["--exclude", "foo.js"], "to yield options", {
      exclude: ["foo.js"],
      args: []
    }));

  it("should parse multiple --exclude option", () =>
    expect(
      ["--exclude", "foo.js", "--exclude", "bar.js", "--exclude", "baz.js"],
      "to yield options",
      {
        exclude: ["foo.js", "bar.js", "baz.js"],
        args: []
      }
    ));

  it("should parse --file option", () =>
    expect(["--file", "foo.js"], "to yield options", {
      file: ["foo.js"],
      args: []
    }));

  it("should parse multiple --file option", () =>
    expect(
      ["--file", "foo.js", "--file", "bar.js", "--file", "baz.js"],
      "to yield options",
      {
        file: ["foo.js", "bar.js", "baz.js"],
        args: []
      }
    ));

  it("should parse --compilers option", () =>
    expect(["--compilers", "jsx:babel"], "to yield options", {
      compilers: ["jsx:babel"],
      args: []
    }));

  it("should parse --compilers option", () =>
    expect(["--compilers", "jsx:babel,md:md2js"], "to yield options", {
      compilers: ["jsx:babel", "md:md2js"],
      args: []
    }));

  it("should parse all the options option", () =>
    expect(
      [
        "--compilers",
        "jsx:babel,md:md2js",
        "--file",
        "foo.js",
        "--file",
        "bar.js",
        "--file",
        "baz.js",
        "--exclude",
        "bar.js",
        "--exclude",
        "baz.js",
        "--invert",
        "--grep",
        "foo",
        "--recursive",
        "test"
      ],
      "to yield options",
      {
        compilers: ["jsx:babel", "md:md2js"],
        exclude: ["bar.js", "baz.js"],
        file: ["foo.js", "bar.js", "baz.js"],
        invert: true,
        grep: "foo",
        recursive: true,
        args: ["test"]
      }
    ));
});
