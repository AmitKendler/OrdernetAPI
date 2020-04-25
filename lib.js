const axios = require('axios');
const { path, map } = require('ramda');
const {
  accountBalancePath,
  parseAccountHoldings,
  parseAccounts,
  parseAccountHoldingsSummary,
  findFund,
} = require('./utils');

const config = {
  apiUrl: null,
  authorization: null,
};

/**
 * Authenticate against the Spark system of the broker. This function initializes the `apiUrl` and `authorization` fields in the internal config, so that we won't have to authenticate again for each API call. Uses /api/Auth/Authenticate.
 * @param {string} username - The Spark username
 * @param {string} password - The Spark password
 * @param {string} broker - Used to get the API URL like this: `https://spark${broker}.ordernet.co.il/api`. E.g. `nesua`, `meitav`, `psagot`
 * @returns {Void}
 */
const authenticate = async (username, password, broker) => {
  config.apiUrl = `https://spark${broker}.ordernet.co.il/api`;

  const authRes = await axios.post(`${config.apiUrl}/Auth/Authenticate`, {
    username,
    password,
  });

  config.authorization = `Bearer ${authRes.data.l}`;
};

/**
 * @typedef {Object} Account
 * @property {string} key - The account key for API usage (`ACC_XXX-YYYYYY`)
 * @property {string} name - The name listed on the account
 * @property {number} number - The account number (`YYYYYY`)
 */

/**
 * @typedef {Object} HoldingSummary
 * @property {number} totalWorth - the account balance (total worth of all holdings including cash)
 * @property {number} cashWorth - The cash worth of the holdings
 */

/**
 * @typedef {Object} Holding
 * @property {number} fundNumber - The fund number
 * @property {string} fundName - The name of the fund
 * @property {number} fundAmount - The amount of the specified fund
 * @property {number} fundWorth - the cash worth of the specified fund
 * @property {number} fundPercent - The percent of the specifie fund within all of the account's fund
 */

/**
 * @typedef {Object} HoldingWithBalance
 * @property {number} fundNumber - The fund number
 * @property {string} fundName - The name of the fund
 * @property {number} fundAmount - The amount of the specified fund
 * @property {number} fundWorth - the cash worth of the specified fund
 * @property {number} fundPercent - The percent of the specifie fund within all of the account's fund
 * @property {number} amountToBalance - the ammount of cash needed to add / subtract from the fund in order to balance the portfolio
 */

/**
 * Get all the accounts listed under this Spark user. Uses `/api/DataProvider/GetStaticData`.
 * @returns {Array.<Account>} - All accounts listed under this Spark user
 */
const getAccounts = async () => {
  const result = await axios.get(
    `${config.apiUrl}/DataProvider/GetStaticData`,
    {
      headers: {
        authorization: config.authorization,
      },
    },
  );

  return parseAccounts(result);
};

/**
 * Get total balance of an account. Uses `/api/Account/GetAccountSecurities`.
 * @param {Account} account - Account to get balance for
 * @returns {number} - Total balance of the account
 */
const getAccountBalance = async account => {
  const result = await axios(
    `${config.apiUrl}/Account/GetAccountSecurities?accountKey=${account.key}`,
    {
      headers: {
        authorization: config.authorization,
      },
    },
  );
  return path(accountBalancePath, result);
};

/**
 * Gets the account's holding list. Uses `/api/Account/GetHoldings`.
 * @param {Account} account - Account to get balance for
 * @returns {Array.<Holding>} - All holdings listed under this Spark user
 */
const getAccountHoldings = async account => {
  const result = await axios(
    `${config.apiUrl}/Account/GetHoldings?accountKey=${account.key}`,
    {
      headers: {
        authorization: config.authorization,
      },
    },
  );
  return parseAccountHoldings(result);
};

/**
 * Gets the account's holding summary. Uses `/api/Account/GetHoldingsSummery`.
 * @param {Account} account - Account to get balance for
 * @returns {HoldingSummary} - the worth of the accounts cash and total holdings
 */
const getAccountHoldingsSummary = async account => {
  const result = await axios(
    `${config.apiUrl}/Account/GetHoldingsSummery?accountKey=${account.key}`,
    {
      headers: {
        authorization: config.authorization,
      },
    },
  );
  return parseAccountHoldingsSummary(result);
};

/**
 * Convert account key to account number.
 * @param {string} key - The account key for API usage (`ACC_XXX-YYYYYY`)
 * @returns {string} - The account number
 */
const accountKeyToNumber = key => {
  return key.split('-')[1];
};

/**
 * Calculates the ammount of cash to add to each holding in order to balance your
 * portoflio with a desired balanced portfolio.
 * @param {Account} account - Account to balance the porfolio
 * @param {Array.<DesiredHolding>} desiredPortolio - list with the desired percent of each fund/holding
 * @param {boolean} useCashInAccount - flag indicating the function "use" the cash in the account for the balanced portfolio
 * @param {number} additionToPortfolio - addition of cash to the balanced portfolio (defaults to 0)
 * @returns {Array.<HoldingWithBalance>} - The list of the holdings with the needed ammount of cash in order to balance the portfolio
 */
const balancePortoflio = async (
  account,
  desiredPortolio,
  useCashInAccount = false,
  additionToPortfolio = 0,
) => {
  const currentPortfolio = await getAccountHoldings(account);
  const { totalWorth, cashWorth } = await getAccountHoldingsSummary(account);

  return map(desiredFund => {
    const currentFund = findFund(desiredFund.fundNumber, currentPortfolio);
    if (currentFund) {
      const desiredPercent = desiredFund.percent;

      const portfolioWorth = useCashInAccount
        ? totalWorth + additionToPortfolio
        : totalWorth + additionToPortfolio - cashWorth;

      const percentToBalance =
        desiredPercent - (currentFund.fundWorth / portfolioWorth) * 100;

      return {
        ...currentFund,
        amountToBalance: ((percentToBalance / 100) * portfolioWorth).toFixed(2),
      };
    }

    return null;
  }, desiredPortolio);
};

module.exports = {
  config,
  authenticate,
  getAccounts,
  getAccountBalance,
  accountKeyToNumber,
  getAccountHoldings,
  getAccountHoldingsSummary,
  balancePortoflio,
};
