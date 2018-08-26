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

module.exports = function findCommonJsRequireCalls(source) {
  const requireCalls = [];

  const ast = parser.parse(source);

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
        requireCalls.push(node.arguments[0].value);
      }
    }
  });

  return requireCalls;
};
