# mocha-watch

In development - work in progress!

Run tests associated to changed files (based on git status).

```
$ ./bin/mocha-watch
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

## To be implemented

### Add support for ESM syntax

`esprima` supports ESM so it's just a matter of implementing a strategy for
figuring out if a file is using esm or cjs syntax (try esm first, and cjs if
that doesn't work) and then reimplementing the functionality in
`findCommonJsRequireCalls` for esm.

## Known limitations

### Dynamic imports

With `require` it is possible to do dynamic imports. This tool only supports
dependencies that are statically analyzable.

```js
// This will not work...

const pathToModule = "../myModule";
require(pathToModule);
```
