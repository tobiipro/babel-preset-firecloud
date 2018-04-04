// Transforms all top-level variables to be exported + appends "exports." to all references of them
let _ = require('lodash');

module.exports = function() {
  // eslint-disable-next-line fp/no-arguments
  let t = arguments[0].types;

  let _ensureDeclarationExported = function(binding) {
    let declarationPath;

    if (t.isVariableDeclarator(binding.path.node)) {
      declarationPath = binding.path.parentPath;
      t.assertVariableDeclaration(declarationPath);
    }

    if (t.isFunctionDeclaration(binding.path.node)) {
      declarationPath = binding.path;
    }

    if (declarationPath && !t.isExportNamedDeclaration(declarationPath.parent)) {
      declarationPath.replaceWith(t.exportNamedDeclaration(declarationPath.node, [], undefined));
    }
  };

  let _ensureAccessedWithExportsDot = function(binding) {
    // analyzing existing references to go through 'exports.'
    // those, which already do, are not found as references by AST
    let {referencePaths} = binding;

    _.forEach(referencePaths, function(rp) {
      if (!t.isIdentifier(rp.node)) {
        return;
      }

      let isPartOfDeclaration = rp.findParent(function(path) {
        return path === binding.path;
      });

      if (isPartOfDeclaration) {
        return;
      }

      let me = t.memberExpression(t.identifier('exports'), t.identifier(binding.identifier.name));
      rp.replaceWith(me);
    });
  };

  return {
    name: 'firecloud-export-all',
    visitor: {
      Program: function(path, _state) {
        let topVariables = _.filter(path.scope.bindings, function(binding) {
          return t.isVariableDeclarator(binding.path.node) ||
                t.isFunctionDeclaration(binding.path.node);
        });

        _.forEach(topVariables, _ensureDeclarationExported);
        _.forEach(topVariables, _ensureAccessedWithExportsDot);
      }
    }
  };
};
