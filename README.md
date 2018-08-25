# mocha-watch

In development - work in progress!

Run tests associated to changed files (based on git status).

```
$ ./bin/mocha-watch
```

## Known limitations

### commonjs modules only

For now, only CommonJS support is implemented. Implementing ESM support will be
pretty easy as `esprima` already supports it.

### Dynamic imports

With `require` it is possible to do dynamic imports. This tool only supports
dependencies that are statically analyzable.

```js
// This will not work...

const pathToModule = "../myModule";
require(pathToModule);
```
