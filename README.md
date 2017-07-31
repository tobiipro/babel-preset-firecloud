# babel-preset-firecloud

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

In order to install the required peer dependencies,
you can run `node_modules/babel-preset-firecloud/npm-install-peer-dependencies`.


## Options

Pass `debug`, `loose`, `spec` or `useBuiltIns` to configure presets/plugins,
as per the semantics defined by [babel-preset-env](https://github.com/babel/babel-preset-env).

Included presets/plugins can be

- further configured by sending options to each of them
- disabled by sending `{"disabled": true}` as `options`


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
