const importRegExp = /import.+(["'])((?:\\\1|.)*?)\1/;
const requireRegExp = /require\((["'])((?:\\\1|.)*?)\1\)/;

function findAllRequires(source) {
  const requires = [];

  let remainingString = source;
  let match = remainingString.match(requireRegExp);

  while (match) {
    requires.push(match[2]);
    remainingString = remainingString.substr(match.index + match[0].length);
    match = remainingString.match(requireRegExp);
  }

  return requires;
}

function findAllImports(source) {
  const requires = [];

  let remainingString = source;
  let match = remainingString.match(importRegExp);

  while (match) {
    requires.push(match[2]);
    remainingString = remainingString.substr(match.index + match[0].length);
    match = remainingString.match(importRegExp);
  }

  return requires;
}

module.exports = function findRelationsInSourceCode(source) {
  const imports = findAllImports(source);

  if (imports.length > 0) {
    return imports;
  }

  return findAllRequires(source);
};
