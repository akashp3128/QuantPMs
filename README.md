# Quant-Sim Agent

An autonomous prediction market trading agent powered by Monte Carlo simulations. Built for [OpenClaw](https://github.com/openclaw/openclaw).

## Overview

Quant-Sim is a specialized AI agent that combines quantitative finance techniques with prediction market trading on [Kalshi](https://kalshi.com). It analyzes markets using statistical simulations, identifies mispricings, and executes trades autonomously within defined risk parameters.

### Features

- **Monte Carlo Simulations** - Generate thousands of scenarios to estimate probabilities
- **Statistical Rigor** - Every estimate includes confidence intervals and standard errors
- **Autonomous Trading** - Execute trades on Kalshi when edge exceeds thresholds
- **Risk Management** - Kelly criterion position sizing with strict limits
- **Interactive Visualizations** - Plotly.js charts via OpenClaw's canvas tool
- **Discord Integration** - Control and monitor via dedicated Discord channel

## Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- [Kalshi](https://kalshi.com) account with API access
- Discord bot configured in OpenClaw

### Installation

1. **Clone this repository:**
```bash
git clone https://github.com/YOUR_USERNAME/quant-sim-agent.git
cd quant-sim-agent
```

2. **Copy agent files to OpenClaw:**
```bash
# Create agent workspace
mkdir -p ~/.openclaw/agents/quant-sim/workspace

# Copy agent configuration
cp workspace/SOUL.md ~/.openclaw/agents/quant-sim/workspace/
cp workspace/AGENTS.md ~/.openclaw/agents/quant-sim/workspace/

# Copy Kalshi skill
mkdir -p ~/.openclaw/skills/kalshi
cp skills/kalshi/* ~/.openclaw/skills/kalshi/
```

3. **Set up Kalshi API credentials:**
```bash
# Create credentials directory
mkdir -p ~/.openclaw/credentials

# Save your Kalshi private key (from Kalshi dashboard)
# IMPORTANT: Replace with YOUR private key
cat > ~/.openclaw/credentials/kalshi_private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----
EOF

# Secure the key file
chmod 600 ~/.openclaw/credentials/kalshi_private_key.pem
```

4. **Configure environment variables:**

Add to your `.env` file or shell profile:
```bash
export KALSHI_API_KEY_ID="your-api-key-id-here"
export KALSHI_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/kalshi_private_key.pem"
```

5. **Register the agent in OpenClaw:**

Add to `~/.openclaw/openclaw.json`:
```json
{
  "agents": {
    "list": [
      {
        "id": "quant-sim",
        "workspace": "/home/node/.openclaw/agents/quant-sim/workspace",
        "model": "claude-opus-4-6"
      }
    ]
  }
}
```

6. **Optional: Bind to Discord channel:**
```json
{
  "bindings": [
    {
      "agentId": "quant-sim",
      "match": {
        "channel": "discord",
        "peer": {
          "kind": "channel",
          "id": "YOUR_DISCORD_CHANNEL_ID"
        }
      }
    }
  ]
}
```

7. **Restart OpenClaw gateway**

## Usage

### Via Discord

Send messages to your bound Discord channel:

```
Check my Kalshi balance
```

```
Analyze S&P 500 markets for trading opportunities
```

```
Run Monte Carlo simulation for Bitcoin hitting $100k
```

### Via CLI

```bash
# Check balance
node ~/.openclaw/skills/kalshi/kalshi_client.js balance

# View positions
node ~/.openclaw/skills/kalshi/kalshi_client.js positions

# Browse markets
node ~/.openclaw/skills/kalshi/kalshi_client.js markets

# Get specific market
node ~/.openclaw/skills/kalshi/kalshi_client.js market INXD-26MAR07-T4950
```

## Simulation Techniques

### Monte Carlo Simulation

Core technique for probability estimation with convergence rate O(N^{-1/2}).

```python
import numpy as np

def monte_carlo_estimate(n_sims=100000):
    outcomes = np.random.binomial(1, p=0.52, size=n_sims)
    p_hat = outcomes.mean()
    se = np.sqrt(p_hat * (1 - p_hat) / n_sims)

    return {
        "estimate": p_hat,
        "std_error": se,
        "ci_95": (p_hat - 1.96*se, p_hat + 1.96*se),
        "n_samples": n_sims
    }
```

### Geometric Brownian Motion

For modeling asset price paths:

```
S[t+1] = S[t] * exp((μ - 0.5σ²)Δt + σ√Δt * Z)
```

### Variance Reduction

- **Importance Sampling** - 10-100x improvement for tail risk estimation
- **Antithetic Variates** - Reduce variance using negatively correlated samples

## Trading Strategy

### Edge Calculation

```
Edge = Model Probability - Market Price
```

Only trade when Edge > 5%

### Position Sizing (Half-Kelly)

```
Position = (p × b - q) / b × 0.5 × Bankroll
```

Where:
- p = model probability
- q = 1 - p
- b = payout odds

### Risk Limits

| Parameter | Default |
|-----------|---------|
| Bankroll | $50 |
| Max per trade | $10 (20%) |
| Max daily loss | $15 (30%) |
| Max open positions | 5 |
| Min required edge | 5% |

Customize these in `workspace/AGENTS.md`.

## Configuration

### SOUL.md

Defines the agent's identity and core values:
- Rigorous statistical methodology
- Code as proof (executable examples)
- Transparent assumptions
- Calibrated confidence

### AGENTS.md

Contains operational rules:
- Must-always / must-never constraints
- Code standards (NumPy vectorization, confidence intervals)
- Trading authorization and limits
- Visualization standards

## Architecture

```
Discord
    │
    ▼
OpenClaw Gateway
    │
    ▼
quant-sim Agent
    │
    ├── Monte Carlo Engine (Python/NumPy)
    ├── Kalshi Client (Node.js)
    └── Canvas Visualizations (Plotly.js)
    │
    ▼
Kalshi Exchange
```

## API Authentication

The Kalshi client uses RSA-PSS signatures:

1. **Message format:** `{timestamp_ms}{METHOD}{/trade-api/v2/path}`
2. **Algorithm:** RSA-PSS with SHA256, salt length 32
3. **Encoding:** Base64

## File Structure

```
quant-sim-agent/
├── README.md
├── LICENSE
├── .gitignore
├── workspace/
│   ├── SOUL.md          # Agent identity
│   ├── AGENTS.md        # Rules and trading config
│   └── memory/          # Trade logs (gitignored)
└── skills/
    └── kalshi/
        ├── SKILL.md     # API documentation
        └── kalshi_client.js  # Trading client
```

## Disclaimers

1. **Educational Purpose** - Simulations and strategies are for learning
2. **Not Financial Advice** - Model outputs are tools, not signals
3. **Risk of Loss** - Never trade more than you can afford to lose
4. **Model Limitations** - Real markets have fat tails and volatility clustering
5. **Regulatory** - Kalshi is CFTC-regulated; comply with applicable laws

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE)

## Author

**Akash Patel**

---

*Built for autonomous prediction market trading with statistical rigor.*
