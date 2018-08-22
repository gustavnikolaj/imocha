const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const findCommonJsRequireCalls = require("../findCommonJsRequireCalls");

const readFile = promisify(fs.readFile);

module.exports = class File {
  constructor(path, sourceGraph) {
    this.path = path;
    this.sourceGraph = sourceGraph;

    this.loaded = false;
    this.fileContents = null;
  }

  get isTestFile() {
    return !!this._isTestFile;
  }

  get incomingRelations() {
    return this.sourceGraph.relations.filter(({ to }) => to === this.path);
  }

  async load() {
    this.fileContents = await readFile(this.path, "utf-8");
    this.loaded = true;
    await this.findRelations();
  }

  async findRelations() {
    if (!this.loaded) {
      throw new Error("Cannot find relations in unloaded File.");
    }

    const relations = findCommonJsRequireCalls(this.fileContents);
    const dirName = path.dirname(this.path);

    for (const relation of relations) {
      const dest = path.resolve(dirName, relation + ".js");

      await this.sourceGraph.addRelation(this.path, dest);
    }
  }
};
