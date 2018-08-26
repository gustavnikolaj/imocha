const File = require("./File");
const TestFile = require("./TestFile");
const Relation = require("./Relation");

module.exports = class SourceGraph {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.files = [];
    this.testFilePaths = [];
    this.relations = [];
  }

  async populate(testFiles) {
    if (!Array.isArray(testFiles)) {
      throw new Error("You must pass in a list of files to populate from.");
    }

    this.testFilePaths = testFiles;

    for (const filePath of this.testFilePaths) {
      await this.addFileFromPath(filePath);
    }
  }

  async addFileFromPath(filePath) {
    const file = this.testFilePaths.includes(filePath)
      ? new TestFile(filePath, this)
      : new File(filePath, this);

    await file.load();
    this.files.push(file);
  }

  async addRelation(from, to) {
    const relation = new Relation(from, to);

    const dest = this.query({ type: "file", path: to });
    if (!dest) {
      await this.addFileFromPath(to);
    }

    this.relations.push(relation);
  }

  query(queryObj) {
    if (queryObj.type === "file") {
      return this.files.find(file => file.path === queryObj.path);
    }
    return null;
  }
};
