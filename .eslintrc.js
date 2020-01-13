module.exports = {
  root: true,

  extends: [
    'firecloud/node'
  ],

  rules: {
    // no import syntax via babel in this repo
    'global-require': 'off'
  }
};
