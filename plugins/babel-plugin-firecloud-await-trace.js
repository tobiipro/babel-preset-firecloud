// see  https://github.com/amio-io/await-trace/blob/master/src/main.js

module.exports = function() {
  // eslint-disable-next-line fp/no-arguments, prefer-rest-params
  let t = arguments[0].types;


  return {
    name: 'firecloud-await-trace',
    pre() {
      this.visited = new Map();
    },
    visitor: {
      AwaitExpression: function(path) {
        if (this.visited.has(path.node)) {
          return;
        }

        // await (async function(createErr) {
        //   try {
        //     return await fun();
        //   } catch (awaitTraceErr) {
        //     let err = createError();
        //     awaitTraceErr.stack += err.Stack;
        //     throw awaitTraceErr;
        //   }
        // })(() => new Error())

        let uniqAwaitTraceErr = path.scope.generateUidIdentifier('awaitTraceErr');

        let amendErrStack = [
          // let err = createError();
          t.variableDeclaration('let', [
            t.variableDeclarator(t.identifier('err'), t.callExpression(t.identifier('createError'), []))
          ]),
          // awaitTraceErr.stack += newErr.Stack;
          t.expressionStatement(t.assignmentExpression(
            '+=',
            t.memberExpression(uniqAwaitTraceErr, t.identifier('stack')),
            t.binaryExpression(
              '+',
              t.stringLiteral('\n...\n'),
              t.memberExpression(t.identifier('err'), t.identifier('stack'))
            )
          )),
          // throw awaitTraceErr;
          t.throwStatement(uniqAwaitTraceErr)
        ];

        // try { ... } catch (awaitTraceErr) { ... }
        let tryCatch = t.tryStatement(
          t.blockStatement([
            t.returnStatement(path.node)
          ])
          , t.catchClause(uniqAwaitTraceErr, t.blockStatement(amendErrStack))
        );

        // await (async (createErr) => { ... })(() => new Error())
        let replacement = t.awaitExpression(t.callExpression(t.arrowFunctionExpression(
          // params
          [
            t.identifier('createError')
          ],
          // body
          t.blockStatement([
            tryCatch
          ]),
          // async
          true
        ), [
          t.arrowFunctionExpression(
            // params
            [],
            // body
            t.newExpression(t.identifier('Error'), []),
            // async
            false
          )

        ]));

        this.visited.set(path.node, true);
        this.visited.set(replacement, true);

        path.replaceWith(replacement);
      }
    }
  };
};
