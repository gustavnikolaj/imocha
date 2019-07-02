const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const findRelationsInSourceCode = require("../findRelationsInSourceCode");
const isNpmPackage = require("../is-npm-package");
const resolveRequire = require("../resolve-require");
const Relation = require("./Relation");

const readFile = promisify(fs.readFile);

module.exports = class File {
  constructor(path, sourceGraph) {
    this.path = path;
    this.sourceGraph = sourceGraph;
    this.relations = [];
    this.loaded = false;
    this.fileContents = null;
  }

  get isTestFile() {
    return !!this._isTestFile;
  }

  get incomingRelations() {
    return this.sourceGraph.query({ type: "relations", to: this.path });
  }

  async load() {
    this.fileContents = await readFile(this.path, "utf-8");
    this.loaded = true;
    await this.findRelations();
  }

  async reload() {
    this.relations = [];
    await this.load();
  }

  remove() {
    this.sourceGraph.removeFile(this);
  }

  async findRelations() {
    if (!this.loaded) {
      throw new Error("Cannot find relations in unloaded File.");
    }

    if (path.extname(this.path) !== ".js") {
      // Skip scanning for relations in non .js files.
      return;
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
      if (dest) {
        await this.addRelation(dest);
      }
    }
  }

  async addRelation(to) {
    const relation = new Relation(this.path, to);

    if (!this.sourceGraph.query({ type: "file", path: to })) {
      await this.sourceGraph.addFileFromPath(to);
    }

    this.relations.push(relation);
  }
};
