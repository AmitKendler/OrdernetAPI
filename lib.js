const axios = require('axios');
const { path } = require('ramda');
const {
  accountBalancePath,
  parseAccountHoldings,
  parseAccounts,
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
 * Get total balance of an account. Uses `/api/Account/GetAccountSecurities`.
 * @param {Account} account - Account to get balance for
 * @returns {Array.<Holdings>} - All holdings listed under this Spark user
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
 * Convert account key to account number.
 * @param {string} key - The account key for API usage (`ACC_XXX-YYYYYY`)
 * @returns {string} - The account number
 */
const accountKeyToNumber = key => {
  return key.split('-')[1];
};

module.exports = {
  config,
  authenticate,
  getAccounts,
  getAccountBalance,
  accountKeyToNumber,
  getAccountHoldings,
};
