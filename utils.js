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
  pluck,
  sum,
  find,
} = require('ramda');

const responsePath = ['data'];
const accountBalancePath = [responsePath, 'a', 'o'];

const rawAccountPath = [0, 'a'];
const rawAccountKeyPath = ['_k'];
const rawAccountNamePath = ['a', 'e'];
const rawAccountNumberPath = ['a', 'b'];

const rawHoldingFundNumberPath = 'c';
const rawHoldingFundNamePath = 'j';
const rawHoldingfundAmountPath = 'bd';
const rawHoldingFundAvgWorthPath = 'be';
const rawHoldingFundPercentagePath = 'bk';

const rawHoldingCurrentTotal = 'b';
const rawHoldingCurrentCash = 'g';

const renameProp = curry((oldName, newName, obj) =>
  dissoc(oldName, assoc(newName, obj[oldName], obj)),
);

const parseAccountHoldings = pipe(
  path(responsePath),
  map(
    pick([
      rawHoldingFundNumberPath,
      rawHoldingFundNamePath,
      rawHoldingfundAmountPath,
      rawHoldingFundAvgWorthPath,
      rawHoldingFundPercentagePath,
    ]),
  ),
  map(
    pipe(
      renameProp(rawHoldingFundNumberPath, 'fundNumber'),
      renameProp(rawHoldingFundNamePath, 'fundName'),
      renameProp(rawHoldingfundAmountPath, 'fundAmount'),
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

const parseAccountHoldingsSummary = pipe(
  path(responsePath),
  pick([rawHoldingCurrentTotal, rawHoldingCurrentCash]),
  renameProp(rawHoldingCurrentTotal, 'totalWorth'),
  renameProp(rawHoldingCurrentCash, 'cashWorth'),
);

const findFund = (fundNumber, fundList) =>
  find(propEq('fundNumber', fundNumber), fundList);

const summarizePercent = pipe(pluck('fundPercent'), sum);

module.exports = {
  accountBalancePath,
  parseAccountHoldings,
  responsePath,
  parseAccounts,
  parseAccountHoldingsSummary,
  findFund,
  summarizePercent,
};
