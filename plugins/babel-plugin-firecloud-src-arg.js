// fork of https://github.com/furstenheim/babel-plugin-meaningful-logs
// ISC: Copyright 2016 Gabriel Fürstenheim <furstenheim@gmail.com>

let _ = require('lodash');

let isSrcFun = function({path, srcFuns}) {
  let c = path.get('callee');

  if (c.node.type === 'Identifier') {
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
};

module.exports = function() {
  // eslint-disable-next-line fp/no-arguments
  let t = arguments[0].types;

  let getSrcFuns = _.once(function(options) {
    return _.result(options, 'srcFuns');
  });

  return {
    visitor: {
      CallExpression: function(path, state) {
        let srcFuns = getSrcFuns(state.opts);
        if (_.isEmpty(srcFuns)) {
          return;
        }
        if (!isSrcFun({path, srcFuns})) {
          return;
        }

        let filePath = this.file.log.filename;
        let cwd;
        let relativePath;
        let line;
        let column;

        if (filePath.charAt(0) === '/') {
          cwd = process.cwd();
          relativePath = filePath.substring(cwd.length + 1);
        } else {
          relativePath = filePath;
        }

        ({
          line
        } = path.node.loc.start);
        column = path.node.loc.start.column + 1;
        // TODO get function name

        let src = t.objectExpression([
          t.objectProperty(t.identifier('file'), t.stringLiteral(relativePath)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(line)),
          t.objectProperty(t.identifier('column'), t.numericLiteral(column))
        ]);
        let srcArg = t.objectExpression([
          t.objectProperty(t.identifier('_babelSrc'), src)
        ]);
        path.node.arguments.unshift(srcArg);
      }
    }
  };
};
