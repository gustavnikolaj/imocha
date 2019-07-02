const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const isNpmPackage = require("./is-npm-package");

const fsStat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

async function findJsFile(context, requiredPath) {
  const filePath = path.resolve(context, requiredPath + ".js");

  try {
    const stats = await fsStat(filePath);

    if (stats.isFile()) {
      return filePath;
    }
  } catch (e) {}

  return false;
}

async function findJsFileFromPackageJson(context, requiredPath) {
  const dirPath = path.resolve(context, requiredPath);
  const pkgJsonPath = path.resolve(dirPath, "package.json");

  try {
    const pkgJson = JSON.parse(await readFile(pkgJsonPath));

    if (pkgJson.main) {
      const mainPath = path.resolve(dirPath, pkgJson.main);
      const stats = await fsStat(mainPath);

      if (stats.isFile) {
        return mainPath;
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }

  return false;
}

async function findIndexJsFile(context, requiredPath) {
  const filePath = path.resolve(context, requiredPath, "index.js");

  try {
    const stats = await fsStat(filePath);

    if (stats.isFile()) {
      return filePath;
    }
  } catch (e) {}

  return false;
}

module.exports = async function resolveRequire(context, requiredPath) {
  if (isNpmPackage(requiredPath)) {
    throw new Error("Module resolution not yet implemented");
  }

  let result = await findJsFile(context, requiredPath);

  if (!result) {
    result = await findJsFileFromPackageJson(context, requiredPath);
  }

  if (!result) {
    result = await findIndexJsFile(context, requiredPath);
  }

  if (result) {
    return result;
  }

  return null;
};
