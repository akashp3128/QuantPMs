---
name: kalshi
description: Trade prediction markets on Kalshi. Use when asked to check markets, place trades, manage positions, or analyze prediction market opportunities.
metadata:
  {
    "openclaw": {
      "emoji": "📈",
      "requires": { "env": ["KALSHI_API_KEY_ID", "KALSHI_PRIVATE_KEY_PATH"] }
    }
  }
---

# Kalshi Trading Skill

Trade on Kalshi prediction markets via their official API.

## Setup

### 1. Create Kalshi API Key

1. Log in to [kalshi.com](https://kalshi.com)
2. Go to Settings > API Keys
3. Click "Create API Key"
4. **Immediately save** the private key (shown only once)
5. Note the API Key ID

### 2. Configure Credentials

```bash
# Create credentials directory
mkdir -p ~/.openclaw/credentials

# Save your private key
cat > ~/.openclaw/credentials/kalshi_private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----
EOF

# Secure permissions
chmod 600 ~/.openclaw/credentials/kalshi_private_key.pem
```

### 3. Set Environment Variables

Add to your `.env` or shell profile:

```bash
export KALSHI_API_KEY_ID="your-api-key-id"
export KALSHI_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/kalshi_private_key.pem"
```

## Trading Rules

### Risk Management (MANDATORY)

- **Max position size**: 20% of bankroll per trade
- **Max daily loss**: 30% of bankroll
- **Max open positions**: 5 at any time
- **Min edge required**: Only trade when estimated edge > 5%
- **Diversification**: No more than 50% of bankroll in correlated markets

### Trade Execution

1. Always check current balance before trading
2. Use limit orders, not market orders
3. Set reasonable prices (don't chase)
4. Log all trades to memory files

## API Usage

Use the built-in Node.js client at `kalshi_client.js`:

### CLI Commands

```bash
# Check balance
node kalshi_client.js balance

# View open positions
node kalshi_client.js positions

# List open orders
node kalshi_client.js orders

# Browse markets
node kalshi_client.js markets

# Get specific market
node kalshi_client.js market INXD-26MAR07-T4950
```

### Programmatic Usage (Node.js)

```javascript
const { KalshiClient } = require('./kalshi_client.js');

const client = new KalshiClient();

// Check balance
const balance = await client.getBalance();
console.log(`Available: $${(balance.balance / 100).toFixed(2)}`);

// Get markets
const markets = await client.getMarkets(100);

// Place order (ticker, side, count, price_in_cents)
const order = await client.createOrder('TICKER', 'yes', 5, 45);

// Get positions
const positions = await client.getPositions();

// Cancel order
await client.cancelOrder('order-uuid-here');
```

## API Authentication

The client uses RSA-PSS signatures with SHA256.

### Signature Format

```
Message: {timestamp_ms}{HTTP_METHOD}{/trade-api/v2/path}
Algorithm: RSA-PSS with SHA256
Salt Length: 32 bytes (DIGEST_LENGTH)
Encoding: Base64
```

**Important:** The path must include `/trade-api/v2` prefix in the signature.

### Required Headers

```
KALSHI-ACCESS-KEY: your-api-key-id
KALSHI-ACCESS-SIGNATURE: base64-encoded-signature
KALSHI-ACCESS-TIMESTAMP: unix-timestamp-in-milliseconds
```

## Market Analysis

Before trading, analyze:

1. **Current price** vs **fair value estimate**
2. **Time to expiration** (theta decay)
3. **Liquidity** (bid-ask spread)
4. **Correlation** with existing positions
5. **News/catalysts** that could move the market

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/portfolio/balance` | GET | Check available funds |
| `/portfolio/positions` | GET | View open positions |
| `/portfolio/orders` | GET | List orders |
| `/portfolio/orders` | POST | Place new order |
| `/portfolio/orders/{id}` | DELETE | Cancel order |
| `/markets` | GET | Browse markets |
| `/markets/{ticker}` | GET | Get market details |
| `/markets/{ticker}/orderbook` | GET | View order book |

## Disclaimer

Trading involves risk. This skill is for educational purposes. Never trade more than you can afford to lose. Past performance does not guarantee future results.
