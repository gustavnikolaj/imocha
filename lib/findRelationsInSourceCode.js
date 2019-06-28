// const esprima = require("esprima");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function isRequireCallExpression(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require"
  );
}

function isImportDeclaration(node) {
  return node.type === "ImportDeclaration";
}

module.exports = function findRelationsInSourceCode(source) {
  const relations = [];

  const ast = parser.parse(source, {
    // https://babeljs.io/docs/en/next/babel-parser.html#options
    // Will make @babel/parser guess based on the presence of import/export
    sourceType: "unambiguous",
    // https://babeljs.io/docs/en/next/babel-parser.html#plugins
    plugins: [
      // Enable objectRestSpread plugin.
      "objectRestSpread",
      // Enable the JSX syntax plugin
      "jsx"
    ]
  });

  traverse(ast, {
    enter(path) {
      const { node } = path;

      if (isRequireCallExpression(node)) {
        if (node.arguments.length !== 1) {
          // line number = meta.start.line
          throw new Error(
            "Cannot parse require calls with more than one argument." +
              "\n\n    " +
              source.slice(node.loc.start.offset, node.loc.end.offset)
          );
        }
        if (node.arguments[0].type !== "StringLiteral") {
          throw new Error(
            "Can only parse require calls with literal values." +
              "\n\n    " +
              source.slice(node.loc.start.offset, node.loc.end.offset)
          );
        }
        relations.push(node.arguments[0].value);
      }

      if (isImportDeclaration(node)) {
        // If an import declaration does not have a StringLiteral source it will
        // throw a Syntax Error "Unexpected token."

        relations.push(node.source.value);
      }
    }
  });

  return relations;
};
