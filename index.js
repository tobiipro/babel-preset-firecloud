let _ = require('lodash');

let isPluginRequired = function(targets, pluginName) {
  let targetsParser = require('babel-preset-env/lib/targets-parser').default;
  let isPluginRequired = require('babel-preset-env').isPluginRequired;
  let pluginToMinTargets = require('babel-preset-env/data/plugins.json');

  targets = targetsParser(targets);
  let result = isPluginRequired(targets, pluginToMinTargets[pluginName]);
  return result;
};

let hasBeenLogged = false;
let debug = function(options) {
  if (!options.debug || hasBeenLogged) {
    return;
  }

  hasBeenLogged = true;
  console.log('babel-preset-firecloud: `DEBUG` option');
  console.log(JSON.stringify({options: options}, null, 2));
};

let presets = {
  'babel-preset-env': undefined
};

let plugins = {
  'babel-plugin-preval': undefined,
  'babel-plugin-syntax-async-functions': undefined,
  'babel-plugin-syntax-dynamic-import': undefined,
  'babel-plugin-transform-async-to-module-method': undefined,
  'babel-plugin-transform-class-properties': undefined,
  'babel-plugin-transform-exponentiation-operator': undefined,
  'babel-plugin-transform-object-rest-spread': undefined
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
    useBuiltIns: true
  });

  options = _.defaults(options, {
    'babel-preset-env': {
      targets: {
        browsers: [
          'last 2 Chrome versions'
        ],
        node: 'current'
      }
    },

    'babel-plugin-transform-async-to-module-method': {
      module: 'bluebird/js/release/bluebird',
      method: 'coroutine'
    }
  });

  options = _.defaultsDeep(options, {
    'babel-preset-env': {
      debug: options.debug,
      loose: options.loose,
      spec: options.spec,
      useBuiltIns: options.useBuiltIns
    },

    'babel-plugin-transform-async-to-module-method': {
      disabled: true
    },

    'babel-plugin-transform-object-rest-spread': {
      useBuiltIns: options.useBuiltIns
    },

    /* Disabling by-default, because can unexpectedly change how Chrome debugger works.
    It will be looking for a variable "exports.foo", while you point at "foo" and fail. */
    'babel-plugin-firecloud-export-all': {
      disabled: true
    },

    'babel-plugin-firecloud-src-arg': {
      disabled: true
    }
  });

  let asyncToGeneratorIsRequired = isPluginRequired(
    options['babel-preset-env'].targets,
    'transform-async-to-generator'
  );

  if (asyncToGeneratorIsRequired) {
    // enable preferred plugin for supporting async/await syntax
    options['babel-plugin-transform-async-to-module-method'].disabled = false;
  }

  let isAsyncToModuleMethodEnabled =
    _.get(options, 'babel-plugin-transform-async-to-module-method.disabled') !== true;

  if (isAsyncToModuleMethodEnabled) {
    // disable vanilla plugin for supporting async/await syntax
    // the same work is done now by 'babel-plugin-transform-async-to-module-method'
    options['babel-preset-env'].exclude = options['babel-preset-env'].exclude || [];
    options['babel-preset-env'].exclude.push('transform-async-to-generator');

    // enable support for async/await class methods
    options['babel-preset-env'].include = options['babel-preset-env'].include || [];
    options['babel-preset-env'].include.push('transform-es2015-classes');
  }

  _.each(options, function(_options, name) {
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

    throw new Error('Preset/plugin ' +
                    name +
                    ' is unknown to babel-preset-firecloud. I know of ' +
                    _.keys(presets).concat(_.keys(plugins)).join(', ') +
                    '.');
  });

  debug(options);

  let configPresets = _.filter(_.map(presets, function(preset, name) {
    let disabled = _.get(options, name + '.disabled');
    switch (disabled) {
    case true:
      return false;
    case false:
      delete options[name].disabled;
      break;
    }

    return preset(context, options[name]);
  }), Boolean);

  let configPlugins = _.filter(_.map(plugins, function(plugin, name) {
    let disabled = _.get(options, name + '.disabled');
    switch (disabled) {
    case true:
      return false;
    case false:
      delete options[name].disabled;
      break;
    }

    return [plugin, options[name]];
  }), Boolean);

  let config = {
    presets: configPresets,
    plugins: configPlugins
  }

  return config;
};
