const axios = require('axios');

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Fetches the current price of Bitcoin in USD.
 * @returns {Promise<number>} The current price of Bitcoin in USD.
 * @throws {Error} If fetching the price fails.
 */
const getBitcoinPrice = async () => {
  try {
    // Using the simple price endpoint: /simple/price?ids=bitcoin&vs_currencies=usd
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
      },
    });

    if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
      return response.data.bitcoin.usd;
    } else {
      throw new Error('Invalid response structure from CoinGecko API');
    }
  } catch (error) {
    console.error('Error fetching Bitcoin price from CoinGecko:', error.message);
    // Fallback or more sophisticated error handling can be added here
    // For now, rethrow a generic error or a specific error code
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('CoinGecko API Error Status:', error.response.status);
        console.error('CoinGecko API Error Data:', error.response.data);
    } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from CoinGecko API:', error.request);
    }
    throw new Error('Failed to fetch Bitcoin price. The service may be temporarily unavailable.');
  }
};

module.exports = {
  getBitcoinPrice,
};
