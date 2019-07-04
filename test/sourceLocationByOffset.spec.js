const expect = require("unexpected");
const sourceLocationByOffset = require("../lib/sourceLocationByOffset");

describe("sourceLocationByOffset", () => {
  it("should find an index on line 1", () => {
    const string = "Xxx";
    const index = 0;

    expect(string[index], "to be", "X");

    expect(sourceLocationByOffset(string, index), "to equal", {
      line: 1,
      column: 1
    });
  });

  it("should find an index on line 2", () => {
    const string = "xxx\nXxx";
    const index = 4;

    expect(string[index], "to be", "X");

    expect(sourceLocationByOffset(string, index), "to equal", {
      line: 2,
      column: 1
    });
  });

  it("should find something on line 5", () => {
    const string = "xxx\nxxx\nxxx\nxxx\nXxx\nxxx\n";
    const index = 16;

    expect(string[index], "to be", "X");

    expect(sourceLocationByOffset(string, index), "to equal", {
      line: 5,
      column: 1
    });
  });
});
