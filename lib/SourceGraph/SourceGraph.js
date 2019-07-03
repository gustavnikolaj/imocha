const File = require("./File");
const TestFile = require("./TestFile");

module.exports = class SourceGraph {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.files = [];
    this.testFilePaths = [];
  }

  setTestFilePaths(testFiles) {
    if (!Array.isArray(testFiles)) {
      throw new Error("You must pass in a list of files to populate from.");
    }

    this.testFilePaths = testFiles;
  }

  populate(testFiles) {
    this.setTestFilePaths(testFiles);

    return Promise.all(
      this.testFilePaths.map(filePath => this.addFileFromPath(filePath))
    );
  }

  addFileFromPath(filePath) {
    const file = this.testFilePaths.includes(filePath)
      ? new TestFile(filePath, this)
      : new File(filePath, this);

    this.files.push(file);

    return file.load();
  }

  removeFile(fileForRemoval) {
    this.testFilePaths = this.testFilePaths.filter(
      path => fileForRemoval.path !== path
    );
    this.files = this.files.filter(file => file !== fileForRemoval);
  }

  query(queryObj) {
    if (queryObj.type === "file") {
      return this.files.find(file => file.path === queryObj.path);
    } else if (queryObj.type === "relations" && queryObj.to) {
      return this.files.reduce((relations, file) => {
        const matches = file.relations.filter(
          relation => relation.to === queryObj.to
        );

        if (matches.length) {
          return relations.concat(matches);
        }

        return relations;
      }, []);
    } else {
      throw new Error("Unsupported query");
    }
  }
};
