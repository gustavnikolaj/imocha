const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const findRelationsInSourceCode = require("../findRelationsInSourceCode");
const isNpmPackage = require("../isNpmPackage");
const resolveRequire = require("../resolveRequire");

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

    let relations;
    try {
      relations = findRelationsInSourceCode(this.fileContents);
    } catch (e) {
      const [firstErrorLine, ...remainingErrorLines] = e.message.split("\n");

      e.message = [
        firstErrorLine + ` (while parsing "${this.path}")`,
        ...remainingErrorLines
      ].join("\n");

      throw e;
    }
    const dirName = path.dirname(this.path);

    for (const relation of relations) {
      if (isNpmPackage(relation)) {
        // TODO: Look for changes in package.json, package-lock.json or yarn.lock
        continue;
      }
      const dest = await resolveRequire(dirName, relation);
      await this.sourceGraph.addRelation(this.path, dest);
    }
  }
};
