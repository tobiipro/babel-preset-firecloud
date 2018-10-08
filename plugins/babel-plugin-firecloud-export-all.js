// Transforms all top-level variables to be exported + appends "exports." to all references of them
let _ = require('lodash');

module.exports = function() {
  // eslint-disable-next-line fp/no-arguments
  let t = arguments[0].types;

  let _isDeclarationValid = function(declaration) {
    let declarationsInitedWithRequire = _.some(declaration.node.declarations, function(declarator) {
      t.assertVariableDeclarator(declarator);
      let {init} = declarator;
      if (!t.isCallExpression(init) || !t.isIdentifier(init.callee)) {
        return false;
      }

      return init.callee.name === 'require';
    });

    return !declarationsInitedWithRequire;
  };

  let _ensureDeclarationExported = function(declaration) {
    t.assertDeclaration(declaration);
    if (!t.isExportNamedDeclaration(declaration.parent)) {
      declaration.replaceWith(t.exportNamedDeclaration(declaration.node, []));
    }
  };

  let _ensureBindingAccessedWithExportsDot = function(binding) {
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

      rp.replaceWith(
        t.memberExpression(
          t.identifier('exports'),
          t.identifier(binding.identifier.name)));
    });
  };

  let _handleVariableDeclaratorBindings = function(bindings) {
    // There can be multiple vars in 'VariableDeclarator'
    // 'VariableDeclarator' is a part of 'VariableDeclaration'
    // Only 'VariableDeclaration' should be exported
    // example: let { a, b } = c;
    //          ^^^^^^^^^^^^^^^^^  VariableDeclaration (should be exported)
    //              ^^^^^^^^^^^^   VariableDeclarator
    let variableDeclarations = _.map(bindings, function(binding) {
      let declarationPath = binding.path.parentPath;
      t.assertVariableDeclaration(declarationPath.node);
      return declarationPath;
    });

    variableDeclarations = _.uniq(variableDeclarations);
    variableDeclarations = _.filter(variableDeclarations, _isDeclarationValid);

    _.forEach(variableDeclarations, _ensureDeclarationExported);
    _.forEach(bindings, _ensureBindingAccessedWithExportsDot);
  };

  let _handleFunctionDeclarationBindings = function(bindings) {
    let declarationPaths = _.map(bindings, 'path');
    _.forEach(declarationPaths, _ensureDeclarationExported);
    _.forEach(bindings, _ensureBindingAccessedWithExportsDot);
  };

  return {
    name: 'firecloud-export-all',
    visitor: {
      Program: function(path, _state) {
        let variableDeclaratorBindings = _.filter(path.scope.bindings, function(binding) {
          return t.isVariableDeclarator(binding.path.node);
        });
        _handleVariableDeclaratorBindings(variableDeclaratorBindings);

        let functionDeclarationBindings = _.filter(path.scope.bindings, function(binding) {
          return t.isFunctionDeclaration(binding.path.node);
        });
        _handleFunctionDeclarationBindings(functionDeclarationBindings);
      }
    }
  };
};
