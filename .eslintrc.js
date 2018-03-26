module.exports = {
  root: true,

  extends: [
    'firecloud/node.js'
  ],

  rules: {
    // no import syntax via babel in this repo
    'global-require': 'off'
  }
};
