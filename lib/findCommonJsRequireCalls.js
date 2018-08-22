const esprima = require("esprima");

function isRequireCallExpression(node) {
  return (
    node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require"
  );
}

module.exports = function findCommonJsRequireCalls(source) {
  const requireCalls = [];

  esprima.parseScript(source, {}, (node, meta) => {
    if (isRequireCallExpression(node)) {
      if (node.arguments.length !== 1) {
        // line number = meta.start.line
        throw new Error(
          "Cannot parse require calls with more than one argument." +
            "\n\n    " +
            source.slice(meta.start.offset, meta.end.offset)
        );
      }
      if (node.arguments[0].type !== "Literal") {
        throw new Error(
          "Can only parse require calls with literal values." +
            "\n\n    " +
            source.slice(meta.start.offset, meta.end.offset)
        );
      }
      requireCalls.push(node.arguments[0].value);
    }
  });

  return requireCalls;
};
