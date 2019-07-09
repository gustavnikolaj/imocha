const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const debug = require("debug")("imocha:SourceGraph:File");
const sourceLocationByOffset = require("../sourceLocationByOffset");
const findRelationsInSourceCode = require("@gustavnikolaj/find-relations-in-js");
const isNpmPackage = require("../isNpmPackage");
const resolveRequire = require("../resolveRequire");
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

  load() {
    return readFile(this.path, "utf-8").then(content => {
      this.fileContents = content;
      this.loaded = true;
      return this.findRelations();
    });
  }

  reload() {
    this.relations = [];
    return this.load();
  }

  remove() {
    this.sourceGraph.removeFile(this);
  }

  findRelations() {
    if (!this.loaded) {
      return Promise.reject(Error("Cannot find relations in unloaded File."));
    }

    if (path.extname(this.path) !== ".js") {
      // Skip scanning for relations in non .js files.
      return Promise.resolve();
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

      return Promise.reject(e);
    }

    const dirName = path.dirname(this.path);

    return Promise.all(
      relations.map(({ error, value: relation, offset: { start } }) => {
        if (error) {
          const { line, column } = sourceLocationByOffset(
            this.fileContents,
            start
          );
          debug(
            `Unmatched relation: ${error} (in ${this.path}:${line}:${column})`
          );
          return;
        }

        if (isNpmPackage(relation)) {
          // TODO: Look for changes in package.json, package-lock.json or yarn.lock
          return;
        }

        const dest = resolveRequire(dirName, relation);
        if (dest) {
          return this.addRelation(dest);
        }
      })
    );
  }

  addRelation(to) {
    const relation = new Relation(this.path, to);

    if (this.sourceGraph.query({ type: "file", path: to })) {
      this.relations.push(relation);
      return Promise.resolve();
    } else {
      return this.sourceGraph.addFileFromPath(to).then(() => {
        this.relations.push(relation);
      });
    }
  }
};
