const fs = require('fs');

const prettierOptions = JSON.parse(fs.readFileSync('./.prettierrc', 'utf8'));

module.exports = {
  extends: ['airbnb', 'prettier'],
  plugins: ['prettier'],
  parser: 'babel-eslint',
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  rules: {
    'prettier/prettier': ['error', prettierOptions],
  },
  settings: {},
};
