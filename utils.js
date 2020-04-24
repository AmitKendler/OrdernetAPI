const {
  pipe,
  path,
  pick,
  curry,
  dissoc,
  assoc,
  map,
  filter,
  propEq,
} = require('ramda');

const responsePath = ['data'];
const accountBalancePath = [responsePath, 'a', 'o'];

const rawAccountPath = [0, 'a'];
const rawAccountKeyPath = ['_k'];
const rawAccountNamePath = ['a', 'e'];
const rawAccountNumberPath = ['a', 'b'];

const rawHoldingFundNumberPath = 'c';
const rawHoldingFundNamePath = 'j';
const rawHoldingFundAmmountPath = 'bd';
const rawHoldingFundAvgWorthPath = 'be';
const rawHoldingFundPercentagePath = 'bk';

const renameProp = curry((oldName, newName, obj) =>
  dissoc(oldName, assoc(newName, obj[oldName], obj)),
);

const parseAccountHoldings = pipe(
  path(responsePath),
  map(
    pick([
      rawHoldingFundNumberPath,
      rawHoldingFundNamePath,
      rawHoldingFundAmmountPath,
      rawHoldingFundAvgWorthPath,
      rawHoldingFundPercentagePath,
    ]),
  ),
  map(
    pipe(
      renameProp(rawHoldingFundNumberPath, 'fundNumber'),
      renameProp(rawHoldingFundNamePath, 'fundName'),
      renameProp(rawHoldingFundAmmountPath, 'fundAmmount'),
      renameProp(rawHoldingFundAvgWorthPath, 'fundWorth'),
      renameProp(rawHoldingFundPercentagePath, 'fundPercent'),
    ),
  ),
);

const parseAccounts = pipe(
  path(responsePath),
  filter(propEq('b', 'ACC')),
  path(rawAccountPath),
  map(account => ({
    key: path(rawAccountKeyPath, account),
    number: path(rawAccountNamePath, account),
    name: path(rawAccountNumberPath, account),
  })),
);

module.exports = {
  accountBalancePath,
  parseAccountHoldings,
  responsePath,
  parseAccounts,
};
