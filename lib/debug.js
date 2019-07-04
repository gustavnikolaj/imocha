module.exports = (...args) => {
  if (process.env.DEBUG) {
    console.log(...args);
  }
};
