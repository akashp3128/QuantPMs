#!/usr/bin/env node
/**
 * Kalshi API Client
 *
 * A Node.js client for trading on Kalshi prediction markets.
 * Uses RSA-PSS signatures for authentication.
 *
 * Author: Akash Patel
 * License: MIT
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

class KalshiClient {
    /**
     * Create a Kalshi API client.
     * @param {Object} options - Configuration options
     * @param {string} options.apiKeyId - Kalshi API Key ID (or set KALSHI_API_KEY_ID env)
     * @param {string} options.privateKeyPath - Path to RSA private key (or set KALSHI_PRIVATE_KEY_PATH env)
     */
    constructor(options = {}) {
        this.apiKeyId = options.apiKeyId || process.env.KALSHI_API_KEY_ID;
        this.privateKeyPath = options.privateKeyPath || process.env.KALSHI_PRIVATE_KEY_PATH;
        this.baseHost = 'api.elections.kalshi.com';
        this.basePath = '/trade-api/v2';

        if (!this.apiKeyId) {
            throw new Error('KALSHI_API_KEY_ID not set. Set environment variable or pass apiKeyId option.');
        }
        if (!this.privateKeyPath) {
            throw new Error('KALSHI_PRIVATE_KEY_PATH not set. Set environment variable or pass privateKeyPath option.');
        }
        if (!fs.existsSync(this.privateKeyPath)) {
            throw new Error(`Private key file not found: ${this.privateKeyPath}`);
        }

        this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
    }

    /**
     * Sign a message using RSA-PSS with SHA256.
     * @param {string} message - Message to sign
     * @returns {string} Base64-encoded signature
     */
    sign(message) {
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(message);
        return sign.sign({
            key: this.privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: 32  // PSS.DIGEST_LENGTH for SHA256
        }, 'base64');
    }

    /**
     * Make an authenticated API request.
     * @param {string} method - HTTP method
     * @param {string} path - API path (without /trade-api/v2 prefix)
     * @param {Object} body - Request body (for POST/PUT)
     * @returns {Promise<Object>} API response
     */
    request(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now().toString();

            // Sign with full path including /trade-api/v2
            const signPath = this.basePath + path.split('?')[0];
            const message = timestamp + method + signPath;
            const signature = this.sign(message);

            const options = {
                hostname: this.baseHost,
                path: this.basePath + path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'KALSHI-ACCESS-KEY': this.apiKeyId,
                    'KALSHI-ACCESS-SIGNATURE': signature,
                    'KALSHI-ACCESS-TIMESTAMP': timestamp
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`API error ${res.statusCode}: ${data}`));
                    } else {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve(data);
                        }
                    }
                });
            });

            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    // ==================== Account Methods ====================

    /**
     * Get account balance.
     * @returns {Promise<{balance: number, portfolio_value: number}>}
     */
    async getBalance() {
        return this.request('GET', '/portfolio/balance');
    }

    /**
     * Get all open positions.
     * @returns {Promise<{market_positions: Array}>}
     */
    async getPositions() {
        return this.request('GET', '/portfolio/positions');
    }

    /**
     * Get orders by status.
     * @param {string} status - Order status: 'resting', 'pending', 'executed', 'canceled'
     * @returns {Promise<{orders: Array}>}
     */
    async getOrders(status = 'resting') {
        return this.request('GET', `/portfolio/orders?status=${status}`);
    }

    // ==================== Market Methods ====================

    /**
     * Get list of markets.
     * @param {number} limit - Maximum markets to return
     * @param {string} status - Market status: 'open', 'closed', 'settled'
     * @returns {Promise<{markets: Array, cursor: string}>}
     */
    async getMarkets(limit = 100, status = 'open') {
        return this.request('GET', `/markets?status=${status}&limit=${limit}`);
    }

    /**
     * Get specific market by ticker.
     * @param {string} ticker - Market ticker
     * @returns {Promise<Object>}
     */
    async getMarket(ticker) {
        return this.request('GET', `/markets/${ticker}`);
    }

    /**
     * Get order book for a market.
     * @param {string} ticker - Market ticker
     * @returns {Promise<{yes: Array, no: Array}>}
     */
    async getOrderbook(ticker) {
        return this.request('GET', `/markets/${ticker}/orderbook`);
    }

    // ==================== Trading Methods ====================

    /**
     * Place a limit order.
     * @param {string} ticker - Market ticker
     * @param {string} side - 'yes' or 'no'
     * @param {number} count - Number of contracts
     * @param {number} price - Price in cents (1-99)
     * @returns {Promise<{order: Object}>}
     */
    async createOrder(ticker, side, count, price) {
        const body = {
            ticker,
            side,
            type: 'limit',
            count,
            [side === 'yes' ? 'yes_price' : 'no_price']: price
        };
        return this.request('POST', '/portfolio/orders', body);
    }

    /**
     * Cancel an order.
     * @param {string} orderId - Order UUID
     * @returns {Promise<Object>}
     */
    async cancelOrder(orderId) {
        return this.request('DELETE', `/portfolio/orders/${orderId}`);
    }
}

// ==================== CLI Interface ====================

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0]?.toLowerCase();

    if (!cmd) {
        console.log(`
Kalshi Trading Client

Usage: node kalshi_client.js <command> [args]

Commands:
  balance              Check account balance
  positions            View open positions
  orders               List open orders
  markets              Browse available markets
  market <ticker>      Get specific market details
  orderbook <ticker>   View order book

Environment Variables:
  KALSHI_API_KEY_ID          Your Kalshi API Key ID
  KALSHI_PRIVATE_KEY_PATH    Path to your RSA private key file

Example:
  export KALSHI_API_KEY_ID="your-key-id"
  export KALSHI_PRIVATE_KEY_PATH="~/.openclaw/credentials/kalshi_private_key.pem"
  node kalshi_client.js balance
`);
        process.exit(1);
    }

    try {
        const client = new KalshiClient();

        switch (cmd) {
            case 'balance': {
                const bal = await client.getBalance();
                console.log('\n💰 Kalshi Account Balance');
                console.log('━'.repeat(30));
                console.log(`Available:       $${(bal.balance / 100).toFixed(2)}`);
                console.log(`Portfolio Value: $${(bal.portfolio_value / 100).toFixed(2)}`);
                console.log('━'.repeat(30));
                break;
            }

            case 'positions': {
                const pos = await client.getPositions();
                const positions = pos.market_positions || [];
                if (positions.length === 0) {
                    console.log('\n📊 No open positions');
                } else {
                    console.log('\n📊 Open Positions');
                    console.log('━'.repeat(60));
                    for (const p of positions) {
                        const side = p.position > 0 ? 'YES' : 'NO';
                        const contracts = Math.abs(p.position);
                        console.log(`${p.ticker}`);
                        console.log(`  ${contracts} ${side} @ ${p.average_price}¢`);
                    }
                    console.log('━'.repeat(60));
                }
                break;
            }

            case 'orders': {
                const orders = await client.getOrders();
                const orderList = orders.orders || [];
                if (orderList.length === 0) {
                    console.log('\n📋 No open orders');
                } else {
                    console.log('\n📋 Open Orders');
                    console.log('━'.repeat(60));
                    for (const o of orderList) {
                        console.log(`${o.ticker}: ${o.side} ${o.remaining_count}x @ ${o.yes_price || o.no_price}¢`);
                    }
                    console.log('━'.repeat(60));
                }
                break;
            }

            case 'markets': {
                const markets = await client.getMarkets(20);
                const marketList = markets.markets || [];
                console.log(`\n📈 Markets (${marketList.length} shown)\n`);
                for (const m of marketList) {
                    const title = m.title?.substring(0, 55) || 'N/A';
                    console.log(`${m.ticker}`);
                    console.log(`  ${title}`);
                    if (m.yes_ask && m.no_ask) {
                        console.log(`  YES: ${m.yes_bid}¢/${m.yes_ask}¢  NO: ${m.no_bid}¢/${m.no_ask}¢`);
                    }
                    console.log('');
                }
                break;
            }

            case 'market': {
                const ticker = args[1];
                if (!ticker) {
                    console.log('Usage: node kalshi_client.js market <ticker>');
                    process.exit(1);
                }
                const market = await client.getMarket(ticker);
                console.log('\n📊 Market Details\n');
                console.log(JSON.stringify(market, null, 2));
                break;
            }

            case 'orderbook': {
                const ticker = args[1];
                if (!ticker) {
                    console.log('Usage: node kalshi_client.js orderbook <ticker>');
                    process.exit(1);
                }
                const book = await client.getOrderbook(ticker);
                console.log(`\n📖 Order Book: ${ticker}\n`);
                console.log('YES side:', JSON.stringify(book.yes?.slice(0, 5) || []));
                console.log('NO side:', JSON.stringify(book.no?.slice(0, 5) || []));
                break;
            }

            default:
                console.log(`Unknown command: ${cmd}`);
                console.log('Run without arguments for help.');
                process.exit(1);
        }
    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { KalshiClient };

// Run CLI if executed directly
if (require.main === module) {
    main();
}
