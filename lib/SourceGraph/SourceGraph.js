const { promisify } = require("util");
const path = require("path");
const glob = promisify(require("glob"));
const File = require("./File");
const Relation = require("./Relation");

module.exports = class SourceGraph {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.files = [];
    this.relations = [];
  }

  async resolveMochaConfiguration() {
    const defaultConfiguration = {
      globPattern: "./test/*.js",
      recursive: false
    };

    return defaultConfiguration;
  }

  async populate() {
    const config = await this.resolveMochaConfiguration();
    const testFiles = await glob(config.globPattern, {
      cwd: this.rootDir
    });

    for (const relativeFilePath of testFiles) {
      const filePath = path.resolve(this.rootDir, relativeFilePath);
      await this.addFileFromPath(filePath);
    }
  }

  async addFileFromPath(filePath) {
    const file = new File(filePath, this);
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
