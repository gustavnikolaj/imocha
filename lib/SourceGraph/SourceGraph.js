const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const readdir = promisify(fs.readdir);

const File = require("./File");
const Relation = require("./Relation");

module.exports = class SourceGraph {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.files = [];
    this.relations = [];
  }

  async load() {
    const dirPath = this.rootDir;
    const directoryContents = await readdir(dirPath);

    for (const relativeFilePath of directoryContents) {
      const filePath = path.resolve(dirPath, relativeFilePath);
      await this.addFileFromPath(filePath);
    }
  }

  async addFileFromPath(filePath) {
    const file = new File(filePath, this);
    await file.load();
    this.files.push(file);
  }

  addRelation(from, to) {
    const relation = new Relation(from, to);
    this.relations.push(relation);
  }
};
