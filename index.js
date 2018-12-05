let _ = require('lodash');
let babelPresetEnv = require('@babel/preset-env');
let pluginToMinTargets = require('@babel/preset-env/data/plugins.json');
let targetsParser = require('@babel/preset-env/lib/targets-parser').default;

let isPluginRequired = function(targets, pluginName) {
  targets = targetsParser(targets);
  let result = babelPresetEnv.isPluginRequired(targets, pluginToMinTargets[pluginName]);
  return result;
};

let hasBeenLogged = false;
let debug = function(options) {
  if (!options.debug || hasBeenLogged) {
    return;
  }

  hasBeenLogged = true;
  // eslint-disable-next-line no-console
  console.log('babel-preset-firecloud: `DEBUG` option');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({options}, undefined, 2));
};

let presets = {
  '@babel/preset-env': undefined
};

let plugins = {
  'babel-plugin-preval': undefined,
  '@babel/plugin-syntax-dynamic-import': undefined,
  '@babel/plugin-proposal-class-properties': undefined,
  '@babel/plugin-transform-exponentiation-operator': undefined,
  '@babel/plugin-syntax-object-rest-spread': undefined
};

let firecloudPlugins = {
  'babel-plugin-firecloud-export-all': undefined,
  'babel-plugin-firecloud-src-arg': undefined
};

presets = _.mapValues(presets, function(preset, name) {
  preset = require(name);
  if (preset.__esModule) {
    preset = preset.default;
  }
  return preset;
});

plugins = _.mapValues(plugins, function(plugin, name) {
  plugin = require(name);
  if (plugin.__esModule) {
    plugin = plugin.default;
  }
  return plugin;
});

firecloudPlugins = _.mapValues(firecloudPlugins, function(plugin, key) {
  plugin = require(`./plugins/${key}`);
  return plugin;
});

_.merge(plugins, firecloudPlugins);

module.exports = function(context, options) {
  options = _.defaults(options || {}, {
    spec: false,
    loose: false,
    useBuiltIns: 'usage'
  });

  // FIXME temporary backward compat
  options = _.defaults(options, {
    '@babel/preset-env': options['babel-preset-env'],
    '@babel/plugin-syntax-dynamic-import': options['babel-plugin-syntax-dynamic-import'],
    '@babel/plugin-proposal-class-properties': options['babel-plugin-transform-class-properties'],
    '@babel/plugin-transform-exponentiation-operator': options['babel-plugin-transform-exponentiation-operator'],
    '@babel/plugin-syntax-object-rest-spread': options['babel-plugin-transform-object-rest-spread']
  });
  delete options['babel-preset-env'];
  delete options['babel-plugin-syntax-dynamic-import'];
  delete options['babel-plugin-transform-class-properties'];
  delete options['babel-plugin-transform-exponentiation-operator'];
  delete options['babel-plugin-transform-object-rest-spread'];

  options = _.defaults(options, {
    '@babel/preset-env': {
      targets: {
        browsers: [
          'last 2 Chrome versions'
        ],
        node: 'current'
      }
    }
  });

  options = _.defaultsDeep(options, {
    '@babel/preset-env': {
      debug: options.debug,
      loose: options.loose,
      spec: options.spec,
      useBuiltIns: options.useBuiltIns
    },

    'babel-plugin-firecloud-src-arg': {
      disabled: true
    }
  });

  let asyncToGeneratorIsRequired = isPluginRequired(
    options['@babel/preset-env'].targets,
    'transform-async-to-generator'
  );

  if (asyncToGeneratorIsRequired) {
    // use bluebird instead of generators
    let asyncToGeneratorOptions =
        options['@babel/preset-env']['@babel/plugin-transform-async-to-generator'] || {
          module: 'bluebird/js/release/bluebird',
          method: 'coroutine'
        };
    options['@babel/preset-env']['@babel/plugin-transform-async-to-generator'] = asyncToGeneratorOptions;
  }

  _.forEach(options, function(_options, name) {
    if (_.includes([
      'debug',
      'loose',
      'spec',
      'useBuiltIns'
    ], name)) {
      return;
    }

    if (presets[name] || plugins[name]) {
      return;
    }

    throw new Error(`Preset/plugin ${
                    name
                    } is unknown to babel-preset-firecloud. I know of ${
                    _.keys(presets).concat(_.keys(plugins)).join(', ')
                    }.`);
  });

  debug(options);

  let configPresets = _.filter(_.map(presets, function(preset, name) {
    let disabled = _.get(options, `${name}.disabled`);
    switch (disabled) {
    case true:
      return false;
    case false:
      delete options[name].disabled;
      break;
    case undefined:
      break;
    default:
      throw new Error(`Unknown option for ${name}.disabled: ${disabled}.`);
    }

    return preset(context, options[name]);
  }), Boolean);

  let configPlugins = _.without(_.map(plugins, function(plugin, name) {
    let disabled = _.get(options, `${name}.disabled`);
    switch (disabled) {
    case true:
      return undefined;
    case false:
      delete options[name].disabled;
      break;
    case undefined:
      break;
    default:
      throw new Error(`Unknown option for ${name}.disabled: ${disabled}.`);
    }

    return [plugin, options[name]];
  }), undefined);

  let config = {
    presets: configPresets,
    plugins: configPlugins
  };

  return config;
};
