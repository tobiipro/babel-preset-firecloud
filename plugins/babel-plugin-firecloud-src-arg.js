/* eslint-disable */

// fork of https://github.com/furstenheim/babel-plugin-meaningful-logs
// ISC: Copyright 2016 Gabriel Fürstenheim <furstenheim@gmail.com>

var _ = require('lodash');

// copied from src/core/log/logger.js
var levels = {
  // https://tools.ietf.org/html/rfc3164 (multiplier 10)
  emergency: 0,
  alert: 10,
  critical: 20,
  error: 30,
  warning: 40,
  notice: 50,
  informational: 60,
  debug: 70,

  // console
  warn: 40, // warning
  info: 60, // informational
  trace: 80,

  // alias
  fatal: 0, // emergency
  verbose: 70, // debug
  silly: 80
};

var srcFuns = [];
srcFuns = srcFuns.concat(_.map(_.keys(levels), function(level) {
  return '_log.' + level;
}))
srcFuns = srcFuns.concat(_.map(_.keys(levels), function(level) {
  return '_log.local.' + level;
}))
srcFuns = srcFuns.concat(_.map(srcFuns, function(fun) {
  return 'exports.' + fun;
}))

var isSrcFun = function(path) {
  var c = path.get('callee');

  if (c.node.type === 'Identifier') {
    // NOTE matchesPattern above doesn't work. Bug?!
    return _.some(srcFuns, function(fun) {
      return c.node.name === fun;
    });
  }

  if (c.node.type === 'MemberExpression') {
    return _.some(srcFuns, function(fun) {
      return c.matchesPattern(fun, false);
    });
  }

  return false;
}

module.exports = function() {
  let t = arguments[0].types;

  return {
    visitor: {
      CallExpression: function(path, options) {
        if (!isSrcFun(path)) {
          return;
        }

        var filePath = this.file.log.filename;
        var cwd;
        var relativePath;
        var line;
        var column;

        if (filePath.charAt(0) !== '/') {
          relativePath = filePath;
        } else {
          cwd = process.cwd();
          relativePath = filePath.substring(cwd.length + 1);
        }

        line = path.node.loc.start.line;
        column = path.node.loc.start.column + 1;
        // TODO get function name

        var src = t.objectExpression([
          t.objectProperty(t.identifier('file'), t.stringLiteral(relativePath)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
          t.objectProperty(t.identifier('column'), t.numericLiteral(column))
        ]);
        var srcArg = t.objectExpression([
          t.objectProperty(t.identifier('_babelSrc'), src)
        ]);
        path.node.arguments.unshift(srcArg);
      }
    }
  };
};
