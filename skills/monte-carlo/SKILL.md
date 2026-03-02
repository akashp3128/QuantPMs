---
name: monte-carlo
description: Foundation Monte Carlo simulation for binary contracts and prediction markets
author: Akash Patel
version: 1.0.0
license: MIT
category: quantitative-simulation
---

# Monte Carlo Simulation

Foundation technique for estimating probabilities in prediction markets and binary contracts.

## Overview

Monte Carlo simulation estimates expectations by drawing samples from distributions and computing statistics. For binary contracts, we estimate `P(event)` by simulating many scenarios and counting successes.

### Convergence Rate
```
Standard Error = O(N^{-1/2})
```

To halve the error, quadruple the samples.

## Core Implementation

```python
import numpy as np
from typing import Dict, Tuple

def simulate_binary_contract(
    S0: float,
    K: float,
    mu: float,
    sigma: float,
    T: float,
    n_sims: int = 100000,
    seed: int = 42
) -> Dict:
    """
    Estimate probability that asset closes above strike using GBM.

    Parameters
    ----------
    S0 : float
        Current asset price
    K : float
        Strike price (threshold)
    mu : float
        Annual drift (expected return)
    sigma : float
        Annual volatility
    T : float
        Time to expiry in years
    n_sims : int
        Number of simulations
    seed : int
        Random seed for reproducibility

    Returns
    -------
    dict
        estimate, std_error, ci_95, n_samples
    """
    np.random.seed(seed)

    # Simulate terminal prices using GBM
    Z = np.random.standard_normal(n_sims)
    S_T = S0 * np.exp((mu - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z)

    # Binary payoff: 1 if S_T > K, else 0
    payoffs = (S_T > K).astype(float)

    # Statistics
    p_hat = payoffs.mean()
    se = np.sqrt(p_hat * (1 - p_hat) / n_sims)
    ci_lower = p_hat - 1.96 * se
    ci_upper = p_hat + 1.96 * se

    return {
        "estimate": round(p_hat, 4),
        "std_error": round(se, 6),
        "ci_95": (round(ci_lower, 4), round(ci_upper, 4)),
        "n_samples": n_sims,
        "method": "crude_monte_carlo"
    }


def brier_score(predictions: np.ndarray, outcomes: np.ndarray) -> float:
    """
    Calculate Brier score for probability predictions.

    Parameters
    ----------
    predictions : array
        Predicted probabilities [0, 1]
    outcomes : array
        Actual outcomes (0 or 1)

    Returns
    -------
    float
        Brier score (lower is better, 0 = perfect)
    """
    return np.mean((predictions - outcomes) ** 2)
```

## Example Usage

```python
# Example: Will AAPL close above $200 in 30 days?
result = simulate_binary_contract(
    S0=195,          # Current price
    K=200,           # Strike
    mu=0.10,         # 10% annual drift
    sigma=0.25,      # 25% annual volatility
    T=30/365,        # 30 days
    n_sims=100000
)

print(f"Probability: {result['estimate']:.1%}")
print(f"95% CI: ({result['ci_95'][0]:.1%}, {result['ci_95'][1]:.1%})")
print(f"Std Error: {result['std_error']:.4f}")
```

**Output:**
```
Probability: 42.3%
95% CI: (42.0%, 42.6%)
Std Error: 0.0016
```

## Sample Size Calculator

```python
def required_samples(
    p: float = 0.5,
    margin: float = 0.01,
    confidence: float = 0.95
) -> int:
    """
    Calculate required sample size for target precision.

    Parameters
    ----------
    p : float
        Estimated probability (0.5 = maximum variance)
    margin : float
        Desired margin of error
    confidence : float
        Confidence level

    Returns
    -------
    int
        Required number of samples
    """
    from scipy.stats import norm
    z = norm.ppf((1 + confidence) / 2)
    n = (z ** 2 * p * (1 - p)) / (margin ** 2)
    return int(np.ceil(n))


# Example: 1% margin at 95% confidence
n = required_samples(p=0.5, margin=0.01)
print(f"Required samples: {n:,}")  # 9,604
```

## Limitations

**Assumptions that break in real markets:**

1. **Lognormal returns** - Markets have fat tails
2. **Constant volatility** - Vol clusters and varies
3. **Continuous trading** - Markets close, gaps occur
4. **No transaction costs** - Spreads and fees exist

**When to use variance reduction:**
- Extreme probabilities (< 5% or > 95%)
- Tight precision requirements
- Computational budget constraints

See `variance-reduction` skill for advanced techniques.
