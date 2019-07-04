# imocha

[![npm version](https://badge.fury.io/js/imocha.svg)](https://www.npmjs.com/package/imocha)
[![Build Status](https://travis-ci.com/gustavnikolaj/imocha.svg?branch=master)](https://travis-ci.com/gustavnikolaj/imocha)
[![Coverage Status](https://coveralls.io/repos/github/gustavnikolaj/imocha/badge.svg?branch=master)](https://coveralls.io/github/gustavnikolaj/imocha?branch=master)
[![Depfu](https://badges.depfu.com/badges/2c81fa4b3f304532a25c118a01079e17/overview.svg)](https://depfu.com/github/gustavnikolaj/imocha?project_id=8440)

In development - work in progress!

Run tests associated to changed files (based on git status).

```
$ npm install --save-dev imocha
```

or...

```
$ yarn add -D imocha
```

Run the tests related to the changed files:

```
$ imocha
```

## Description

When the cli is started, it will map out the test files and each of the source
files that they depend on - this is done through the `SourceGraph` class.

Then it looks at the dirty files (determined by running `git status`) and checks
which of the test files would be relevant to run based on which files has been
changed.

The tests are being run by mocha itself - a process is forked off from which
mocha is loaded. This happens on every single run to make sure that there is no
pollution between test runs. This is the responsibility of the `MochaWorker` class.

The orchestration of the above, and the watching of files are handled within the
`MochaWatch` class.

## Tips

### Debugging tests that aren't being picked up

If you experience that some of your tests aren't being executed where they
should, try running imocha with a DEBUG environment variable with the value
`true`:

```
$ DEBUG=true imocha
```

This will output debug information from imocha, and among that it will report
about `require` and `import` statements that it saw, but could not resolve. It
could as an example be caused by calling require with a variable as the value,
which would be reported as such:

```
Unmatched relation: Non literal require. (in /path/to/file.js:18:29)
```

## Known limitations

### Dynamic imports

With `require` it is possible to do dynamic imports. This tool only supports
dependencies that are statically analyzable.

```js
// This will not work...

const pathToModule = "../myModule";
require(pathToModule);
```
