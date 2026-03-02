# QuantPMs

Institutional-grade prediction market simulation engine with live trading capabilities.

Built for [OpenClaw](https://github.com/openclaw/openclaw).

## Overview

QuantPMs combines quantitative finance techniques with prediction market trading on [Kalshi](https://kalshi.com). It provides rigorous Monte Carlo simulations, variance reduction methods, real-time Bayesian updating, and autonomous trading within defined risk parameters.

### Core Capabilities

| Skill | Description |
|-------|-------------|
| **Monte Carlo** | Foundation simulation for binary contracts |
| **Variance Reduction** | Importance sampling, antithetic variates (100-10,000x efficiency) |
| **Particle Filters** | Sequential Monte Carlo for real-time probability updates |
| **Copula Modeling** | Tail dependence for correlated outcomes |
| **Agent-Based Sim** | Market microstructure and price discovery |
| **Kalshi Trading** | Live trading with RSA-PSS authentication |

## Quick Start

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed
- [Kalshi](https://kalshi.com) account with API access
- Discord bot configured (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/akashp3128/QuantPMs.git
cd QuantPMs

# Copy to OpenClaw
mkdir -p ~/.openclaw/agents/quantpms/workspace
cp -r workspace/* ~/.openclaw/agents/quantpms/workspace/
cp -r skills/* ~/.openclaw/skills/
cp -r knowledge ~/.openclaw/agents/quantpms/
cp RULES.md ~/.openclaw/agents/quantpms/workspace/
```

### Configure Kalshi Credentials

```bash
# Create credentials directory
mkdir -p ~/.openclaw/credentials

# Save your private key (from Kalshi dashboard)
cat > ~/.openclaw/credentials/kalshi_private_key.pem << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----
EOF

chmod 600 ~/.openclaw/credentials/kalshi_private_key.pem

# Set environment variables
export KALSHI_API_KEY_ID="your-api-key-id"
export KALSHI_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/kalshi_private_key.pem"
```

### Register Agent

Add to `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "list": [
      {
        "id": "quantpms",
        "workspace": "/home/node/.openclaw/agents/quantpms/workspace",
        "model": "claude-opus-4-6"
      }
    ]
  }
}
```

## Simulation Techniques

### Monte Carlo Estimation

```python
import numpy as np

def simulate_binary_contract(S0, K, mu, sigma, T, n_sims=100000):
    """Estimate P(S_T > K) using GBM simulation."""
    np.random.seed(42)

    Z = np.random.standard_normal(n_sims)
    S_T = S0 * np.exp((mu - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)

    payoffs = (S_T > K).astype(float)
    p_hat = payoffs.mean()
    se = np.sqrt(p_hat * (1 - p_hat) / n_sims)

    return {
        "estimate": p_hat,
        "std_error": se,
        "ci_95": (p_hat - 1.96*se, p_hat + 1.96*se),
        "n_samples": n_sims
    }
```

**Convergence Rate:** `O(N^{-1/2})` - halve error by 4x samples.

### Variance Reduction

Importance sampling achieves **100-10,000x** efficiency for rare events:

```python
def importance_sampling_tail(threshold, n_sims=1000):
    """Estimate P(Z > threshold) efficiently."""
    shift = threshold
    Z = np.random.normal(shift, 1, n_sims)
    weights = np.exp(-shift * Z + 0.5 * shift**2)
    indicators = (Z > threshold).astype(float)

    return (indicators * weights).mean()
```

### Particle Filters

Real-time Bayesian updating for live events:

```python
class ParticleFilter:
    def update(self, observation):
        # Propagate particles via logit random walk
        # Reweight based on observation likelihood
        # Resample when ESS < N/2
        pass
```

### Copula Modeling

**Critical for correlated contracts.** Gaussian copulas have zero tail dependence - use Student-t for extreme events:

| Copula | Lower Tail λ | Upper Tail λ |
|--------|-------------|--------------|
| Gaussian | 0 | 0 |
| Student-t (ν=4) | 0.18 | 0.18 |
| Clayton | > 0 | 0 |
| Gumbel | 0 | > 0 |

## Trading Strategy

### Edge Calculation

```
Edge = Model Probability - Market Price
```

**Only trade when Edge > 5%**

### Position Sizing (Half-Kelly)

```
f = (p × b - q) / b × 0.5
```

### Risk Limits

| Parameter | Default |
|-----------|---------|
| Max per trade | 20% of bankroll |
| Max daily loss | 30% of bankroll |
| Max open positions | 5 |
| Min required edge | 5% |

## Key Formulas

### Sample Size for Precision
```
N = z²_{α/2} × p(1-p) / ε²
```

### Geometric Brownian Motion
```
S_T = S_0 × exp((μ - 0.5σ²)T + σ√T × Z)
```

### Brier Score (Calibration)
```
BS = (1/N) × Σ(p_i - o_i)²
```

- BS < 0.10 = Excellent
- BS < 0.25 = Good

See `knowledge/formulas.md` for complete reference.

## Project Structure

```
QuantPMs/
├── agent.yaml           # Agent configuration
├── RULES.md             # Operational guidelines
├── workspace/
│   ├── SOUL.md          # Agent identity
│   └── AGENTS.md        # Trading rules
├── knowledge/
│   ├── formulas.md      # Key formulas
│   ├── references.md    # Academic citations
│   └── index.yaml       # Knowledge index
├── skills/
│   ├── monte-carlo/     # Foundation simulation
│   ├── variance-reduction/  # Efficiency techniques
│   ├── particle-filter/ # Real-time updating
│   ├── copula-modeling/ # Dependency modeling
│   ├── agent-based-sim/ # Market microstructure
│   └── kalshi/          # Live trading client
└── examples/
    ├── .env.example
    └── trades.example.json
```

## Usage Examples

### Via Discord

```
Check my Kalshi balance
```

```
Run Monte Carlo simulation: Will S&P close above 5000 by Friday?
Current: 4980, volatility: 15%, drift: 10%
```

```
Analyze correlation between swing state outcomes using t-copula
```

### Via CLI

```bash
# Check balance
node ~/.openclaw/skills/kalshi/kalshi_client.js balance

# View positions
node ~/.openclaw/skills/kalshi/kalshi_client.js positions

# Browse markets
node ~/.openclaw/skills/kalshi/kalshi_client.js markets
```

## Disclaimers

1. **Educational Purpose** - Simulations are for learning, not guaranteed profits
2. **Not Financial Advice** - Model outputs are tools, not trading signals
3. **Risk of Loss** - Never trade more than you can afford to lose
4. **Model Limitations** - Real markets have fat tails and volatility clustering

## References

See `knowledge/references.md` for academic citations including:

- Kyle (1985) - Market microstructure
- Glasserman (2004) - Monte Carlo methods
- Gode & Sunder (1993) - Zero-intelligence traders
- Aas et al. (2009) - Vine copulas

## License

MIT License - see [LICENSE](LICENSE)

## Author

**Akash Patel**

---

*Institutional-grade prediction market simulation with live trading capabilities.*
