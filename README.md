# babel-preset-firecloud [![Build Status][2]][1]

In your project's `.babelrc.js`

```js
module.exports = {
  presets: [
    ['firecloud', {
      // debug: false,
      // loose: false,
      // spec: false,
      // useBuiltIns: true,
      // 'preset|plugin': {...options}
    }]
  ]
};
```

Optionally, you can run `node_modules/babel-preset-firecloud/npm-install-peer-dependencies`
in order to install the required peer dependencies.


## Options

Pass `debug`, `loose`, `spec` or `useBuiltIns` to configure presets/plugins,
as per the semantics defined by [babel-preset-env](https://github.com/babel/babel-preset-env).

Included presets/plugins can be

- further configured by sending options to each of them
- disabled by sending `{"disabled": true}` as `options`


## Firecloud plugins

### `babel-plugin-firecloud-export-all` (default: disabled)

Makes all top-level module definitions exported (adding `export` keyword to declaration).

Additionally all references to these variables will be replaced with `exports.<reference>`.
This is a closer behaviour to ES6 export bindings,
where changing the exported value outside of the module would make the change reflect inside the module.
See http://2ality.com/2015/07/es6-module-exports.html .

In:

```js
let _a = 5;

let foo = function() {
  return _a;
}
```

Out:

```js
export let _a = 5;

export let foo = function() {
  return exports._a;
}
```

**NOTE** A negative side-effect. While debugging, Chrome won't be able to get the value of an exported variable,
because the source map will reference `exports.something`, while you still hover `something`.

To enable in `.babelrc.js`:

```js
module.exports = {
  presets: [
    ['firecloud', {
      'babel-plugin-firecloud-export-all': {
        disabled: false
      }
    }]
  ]
};
```

### `babel-plugin-firecloud-src-arg` (disabled by default)

Adds an extra argument with info about location (file/line/column) to calls of a function e.g. logger.

To enable in `.babelrc.js`:

```js
module.exports = {
  presets: [
    ['firecloud', {
      'babel-plugin-firecloud-src-arg': {
        disabled: false
      }
    }]
  ]
};
```


## Notable plugins (not included)

1. https://github.com/kmagiera/babel-watch
1. https://github.com/furstenheim/babel-plugin-meaningful-logs
1. https://github.com/kentcdodds/babel-plugin-preval


## Misc plugins

1. https://github.com/codemix/flow-runtime/tree/master/packages/babel-plugin-flow-runtime
1. https://github.com/vitalets/babel-plugin-runtyper
1. https://github.com/loganfsmyth/babel-plugin-transform-builtin-extend
1. https://github.com/miraks/babel-plugin-implicit-return
1. https://github.com/andreineculau/babel-plugin-thin-arrows


## License

[UNLICENSE](UNLICENSE)


  [1]: https://travis-ci.org/tobiipro/babel-preset-firecloud
  [2]: https://travis-ci.org/tobiipro/babel-preset-firecloud.svg?branch=master
