/* eslint-disable */
var _ = require('lodash');

module.exports = function() {
  let t = arguments[0].types;

  let log = function() {
    // console.log.apply(console.log, arguments)
  }

  let logVerbose = function() {
    // console.log.apply(console.log, arguments)
  }

  let exportAllVisitor = {

    VariableDeclaration(path) {
      // only top-level scope declarations
      if (path.scope.parent !== null) {
        path.stop();
        return;
      }

      let identifierNode = path.node.declarations[0].id;
      let name = identifierNode.name;

      // making sure that declaration has 'export' keyword
      if (path.parent.type !== 'ExportNamedDeclaration') {
        log(`Exporting '${name}'`);
        logVerbose(JSON.stringify(path.node));
        path.replaceWith(t.exportNamedDeclaration(path.node, [], null));
      }

      // analyzing existing references to go through 'exports.'
      // those, which already do, are not found as references by AST
      let binding = path.scope.bindings[name];
      let referencePaths = binding.referencePaths;

      _.forEach(referencePaths, function(rp) {
        // includes declaration reference too, not interested
        if (!t.isIdentifier(rp.node)) {
          return;
        }

        // all the references have to go through 'exports.'
        log(`Replacing reference with 'exports.' for ${name}`);
        rp.replaceWith(t.memberExpression(t.identifier("exports"), t.identifier(name)));
      });
    }

  };

  return {
    visitor: {
      "Program": function(path, state) {

        log(`Processing file: ${this.file.opts.filename}`);
        path.traverse(exportAllVisitor);
      }
    }
  };
};
