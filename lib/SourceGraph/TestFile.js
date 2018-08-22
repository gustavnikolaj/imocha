const File = require("./File");

module.exports = class TestFile extends File {
  constructor(...args) {
    super(...args);

    this._isTestFile = true;
  }
};
