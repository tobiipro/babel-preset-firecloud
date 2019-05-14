let _ = require('lodash');
let pluginTester = require('babel-plugin-tester');
let plugin = require('../plugins/babel-plugin-firecloud-await-trace');

pluginTester({
  plugin,
  tests: {
    'should not add try-catch for sync call': {
      code: [
        'function main() {',
        '  fun();',
        '}'
      ].join('\n')
    },

    'should add try-catch for async call': {
      code: [
        'async function main() {',
        '  await asyncFun()',
        '}'
      ].join('\n'),
      output: [
        'async function main() {',
        '  await (async createError => {',
        '    try {',
        '      return await asyncFun();',
        '    } catch (_awaitTraceErr) {',
        '      let err = createError();',
        '      _awaitTraceErr.stack += "\\n...\\n" + err.stack;',
        '      throw _awaitTraceErr;',
        '    }',
        '  })(() => new Error());',
        '}'
      ].join('\n')
    },

    'should add try-catch for async call, when _awaitTraceErr is already defined': {
      code: [
        'async function main() {',
        '  let _awaitTraceErr;',
        '',
        '  await asyncFun()',
        '}'
      ].join('\n'),
      output: [
        'async function main() {',
        '  let _awaitTraceErr;',
        '',
        '  await (async createError => {',
        '    try {',
        '      return await asyncFun();',
        '    } catch (_awaitTraceErr2) {',
        '      let err = createError();',
        '      _awaitTraceErr2.stack += "\\n...\\n" + err.stack;',
        '      throw _awaitTraceErr2;',
        '    }',
        '  })(() => new Error());',
        '}'
      ].join('\n')
    },

    'should add try-catch for async call in assignment': {
      code: [
        'async function main() {',
        '  let a = await asyncFun()',
        '}'
      ].join('\n'),
      output: [
        'async function main() {',
        '  let a = await (async createError => {',
        '    try {',
        '      return await asyncFun();',
        '    } catch (_awaitTraceErr) {',
        '      let err = createError();',
        '      _awaitTraceErr.stack += "\\n...\\n" + err.stack;',
        '      throw _awaitTraceErr;',
        '    }',
        '  })(() => new Error());',
        '}'
      ].join('\n')
    }
  }
});
