let _ = require('lodash');
let pluginTester = require('babel-plugin-tester');
let plugin = require('../plugins/babel-plugin-firecloud-export-all');

let newline = function(lines) {
  return _.join(lines, '\n');
};

pluginTester({
  plugin,
  tests: {
    'should not reexport exported var': 'export let a = 5;',

    'should not add exports if already has':
      'export let a = 5;\nconsole.log(exports.a);',

    'should export and use exports.': {
      code: 'let a = 5;console.log(a);',
      output: 'export let a = 5;\nconsole.log(exports.a);'
    },

    'should export and use exports. for ObjectPattern': {
      code: 'let {a} = b;console.log(a);',
      output: 'export let {\n  a\n} = b;\nconsole.log(exports.a);'
    },

    'should export and use exports. for ArrayPattern': {
      code: 'let [a] = b;console.log(a);',
      output: 'export let [a] = b;\nconsole.log(exports.a);'
    },

    'should export and use exports. for ObjectPattern multiple': {
      code: 'let {a, c} = b;console.log(a, c);',
      output: 'export let {\n  a,\n  c\n} = b;\nconsole.log(exports.a, exports.c);'
    },

    'should export and use exports. for ArrayPattern multiple': {
      code: 'let [a, c] = b;console.log(a, c);',
      output: 'export let [a, c] = b;\nconsole.log(exports.a, exports.c);'
    },

    'should not change shadowing local var': {
      code: newline([
        'let a = 1;',
        'let b = function (a) {',
        '  console.log(a);',
        '};'
      ]),
      output: newline([
        'export let a = 1;',
        'export let b = function (a) {',
        '  console.log(a);',
        '};'
      ])
    },

    'should change inside func': {
      code: newline([
        'let a = 1;',
        'let b = function (c) {',
        '  console.log(a);',
        '};'
      ]),
      output: newline([
        'export let a = 1;',
        'export let b = function (c) {',
        '  console.log(exports.a);',
        '};'
      ])
    },

    'should not change exported func declarations': {
      code: newline([
        'export function a() {}'
      ])
    },

    'should change func declarations': {
      code: 'function a() {}',
      output: 'export function a() {}'
    },

    'should change func declarations 2': {
      code: newline([
        'function a(c) {}',
        'a();'
      ]),
      output: newline([
        'export function a(c) {}',
        'exports.a();'
      ])
    },

    'should not export declarations with "require" in the RHS': {
      code: newline([
        'let a = require("b");',
        'a = 5;'
      ]),
      output: newline([
        'let a = require("b");',
        '',
        'a = 5;'
      ])
    }
  }
});
