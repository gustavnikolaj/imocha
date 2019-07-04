module.exports = function sourceLocationByOffset(string, index) {
  const line = string.substr(0, index).split("\n").length;

  let nextCharIndex = index + 1;

  while (nextCharIndex > 0 && string[nextCharIndex - 1] !== "\n") {
    nextCharIndex -= 1;
  }

  return { line, column: index - nextCharIndex + 1 };
};
