# mocha-watch

In development - work in progress!

Run tests associated to changed files (based on git status).

```
$ ./bin/mocha-watch
```

## To be implemented

### Use mocha commandline options

Right now there's a little defaulting done in `src/SourceGraph/SourceGraph.js`
in the method `resolveMochaConfiguration` which is reimplementing the default
test file glob from mocha.

This should be expanded such that any commandline option passed to mocha is
respected (and passed on to the subshelled mocha) - whether they are passed as
commandline options or in `mocha.opts`.

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
