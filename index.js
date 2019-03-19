let _ = require('lodash');
let pluginToMinTargets = require('@babel/preset-env/data/plugins.json');
let targetsParser = require('@babel/preset-env/lib/targets-parser').default;

let isPluginRequired = function(targets, pluginName) {
  targets = targetsParser(targets);
  // @babel/preset-env@7.4.0 had a breaking change;
  // see https://github.com/babel/babel/issues/9707
  let result;

  let oldIsPluginRequired = require('@babel/preset-env').isPluginRequired;
  if (_.isFunction(oldIsPluginRequired)) {
    result = oldIsPluginRequired(targets, pluginToMinTargets[pluginName]);
    return result;
  }

  let newIsPluginRequired = require('@babel/preset-env/lib/filter-items').isPluginRequired;
  if (_.isFunction(newIsPluginRequired)) {
    result = newIsPluginRequired(targets, pluginToMinTargets[pluginName]);
    return result;
  }

  throw new Error('Cannot find a isPluginRequired function');
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
  console.log(JSON.stringify({
    options
  }, undefined, 2));
};

let presets = {
  '@babel/preset-env': undefined
};

let plugins = {
  '@babel/plugin-proposal-class-properties': undefined,
  '@babel/plugin-syntax-dynamic-import': undefined,
  '@babel/plugin-syntax-object-rest-spread': undefined,
  '@babel/plugin-transform-async-to-generator': undefined,
  '@babel/plugin-transform-exponentiation-operator': undefined,
  'babel-plugin-preval': undefined
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
    useBuiltIns: 'entry'
  });

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

    '@babel/plugin-transform-async-to-generator': {
      disabled: true,
      module: 'bluebird/js/release/bluebird',
      method: 'coroutine'
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
    options['@babel/plugin-transform-async-to-generator'].disabled = false;

    // disable vanilla plugin for supporting async/await syntax
    // the same work is done now by 'babel-plugin-transform-async-to-module-method'
    options['@babel/preset-env'].exclude = options['@babel/preset-env'].exclude || [];
    options['@babel/preset-env'].exclude.push('transform-async-to-generator');
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

    let knownPP = _.concat(_.keys(presets), _.keys(plugins));
    throw new Error(`Preset/plugin ${name} is unknown to babel-preset-firecloud. I know of ${_.join(knownPP, ',')}.`);
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

    return [
      plugin,
      options[name]
    ];
  }), undefined);

  let config = {
    presets: configPresets,
    plugins: configPlugins
  };

  return config;
};
