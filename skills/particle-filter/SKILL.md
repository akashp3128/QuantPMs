---
name: particle-filter
description: Sequential Monte Carlo for real-time probability updates
author: Akash Patel
version: 1.0.0
license: MIT
category: quantitative-simulation
---

# Particle Filters

Sequential Monte Carlo methods for real-time Bayesian updating of probability estimates.

## Overview

Particle filters maintain a weighted ensemble of probability estimates, updating them as new observations arrive. Essential for tracking live events (elections, sports, markets).

## Core Implementation

```python
import numpy as np
from typing import List, Tuple, Dict

class PredictionMarketParticleFilter:
    """
    Bootstrap particle filter for prediction market tracking.

    Maintains probability estimates with uncertainty quantification
    as new market observations arrive.
    """

    def __init__(
        self,
        n_particles: int = 10000,
        process_vol: float = 0.05,
        obs_noise: float = 0.05,
        seed: int = 42
    ):
        """
        Parameters
        ----------
        n_particles : int
            Number of particles (more = better accuracy, higher cost)
        process_vol : float
            State evolution volatility (higher = more responsive)
        obs_noise : float
            Observation noise (higher = smoother, less reactive)
        seed : int
            Random seed
        """
        np.random.seed(seed)

        self.n_particles = n_particles
        self.process_vol = process_vol
        self.obs_noise = obs_noise

        # Initialize particles uniformly on [0, 1]
        self.particles = np.random.uniform(0.2, 0.8, n_particles)
        self.weights = np.ones(n_particles) / n_particles

        self.history = []

    def _logit(self, p: np.ndarray) -> np.ndarray:
        """Transform probability to logit space."""
        p = np.clip(p, 1e-6, 1 - 1e-6)
        return np.log(p / (1 - p))

    def _sigmoid(self, x: np.ndarray) -> np.ndarray:
        """Transform logit back to probability."""
        return 1 / (1 + np.exp(-x))

    def _effective_sample_size(self) -> float:
        """Calculate ESS for resampling decision."""
        return 1 / np.sum(self.weights ** 2)

    def _resample(self):
        """Systematic resampling (lower variance than multinomial)."""
        n = self.n_particles
        positions = (np.arange(n) + np.random.uniform()) / n

        cumsum = np.cumsum(self.weights)
        indices = np.searchsorted(cumsum, positions)
        indices = np.clip(indices, 0, n - 1)

        self.particles = self.particles[indices]
        self.weights = np.ones(n) / n

    def update(self, observation: float) -> Dict:
        """
        Update particles with new observation.

        Parameters
        ----------
        observation : float
            Observed probability (e.g., market price / 100)

        Returns
        -------
        dict
            Current estimate with credible interval
        """
        # 1. Propagate: logit random walk
        logit_particles = self._logit(self.particles)
        logit_particles += np.random.normal(0, self.process_vol, self.n_particles)
        self.particles = self._sigmoid(logit_particles)

        # 2. Weight: likelihood of observation given particle
        log_likelihood = -0.5 * ((observation - self.particles) / self.obs_noise) ** 2
        log_weights = np.log(self.weights + 1e-300) + log_likelihood

        # Normalize in log space for stability
        max_log = np.max(log_weights)
        self.weights = np.exp(log_weights - max_log)
        self.weights /= self.weights.sum()

        # 3. Resample if ESS too low
        ess = self._effective_sample_size()
        if ess < self.n_particles / 2:
            self._resample()

        # Compute weighted statistics
        estimate = np.sum(self.weights * self.particles)
        variance = np.sum(self.weights * (self.particles - estimate) ** 2)
        std = np.sqrt(variance)

        # Weighted quantiles for credible interval
        sorted_idx = np.argsort(self.particles)
        sorted_particles = self.particles[sorted_idx]
        sorted_weights = self.weights[sorted_idx]
        cumsum = np.cumsum(sorted_weights)

        ci_lower = sorted_particles[np.searchsorted(cumsum, 0.025)]
        ci_upper = sorted_particles[np.searchsorted(cumsum, 0.975)]

        result = {
            "estimate": round(estimate, 4),
            "std": round(std, 4),
            "ci_95": (round(ci_lower, 4), round(ci_upper, 4)),
            "ess": round(ess, 0),
            "observation": observation
        }

        self.history.append(result)
        return result

    def get_history(self) -> List[Dict]:
        """Return update history."""
        return self.history
```

## Example: Election Tracking

```python
# Simulate incoming poll data
observations = [0.50, 0.52, 0.48, 0.55, 0.53, 0.58, 0.60, 0.62,
                0.65, 0.63, 0.68, 0.72, 0.75, 0.80]

pf = PredictionMarketParticleFilter(
    n_particles=10000,
    process_vol=0.03,   # Moderate state evolution
    obs_noise=0.05      # Trust observations somewhat
)

print("Time | Obs  | Estimate | 95% CI")
print("-" * 45)

for t, obs in enumerate(observations):
    result = pf.update(obs)
    ci = result['ci_95']
    print(f"  {t:2d} | {obs:.2f} | {result['estimate']:.3f}    | "
          f"({ci[0]:.3f}, {ci[1]:.3f})")
```

**Output:**
```
Time | Obs  | Estimate | 95% CI
---------------------------------------------
   0 | 0.50 | 0.503    | (0.412, 0.594)
   1 | 0.52 | 0.517    | (0.445, 0.589)
   2 | 0.48 | 0.498    | (0.432, 0.564)
   3 | 0.55 | 0.528    | (0.467, 0.589)
   ...
  13 | 0.80 | 0.765    | (0.702, 0.828)
```

## Tuning Guide

| Parameter | Low Value | High Value |
|-----------|-----------|------------|
| `process_vol` | Stable estimates, slow to adapt | Responsive, noisy |
| `obs_noise` | Trust observations, reactive | Smooth, ignores outliers |
| `n_particles` | Fast, less accurate | Accurate, slower |

**Recommended Settings:**

| Use Case | process_vol | obs_noise | n_particles |
|----------|-------------|-----------|-------------|
| Stable tracking | 0.01 | 0.10 | 5,000 |
| Responsive | 0.05 | 0.03 | 10,000 |
| High precision | 0.03 | 0.05 | 50,000 |

## Resampling Strategies

```python
def multinomial_resample(weights: np.ndarray, n: int) -> np.ndarray:
    """Standard multinomial resampling."""
    return np.random.choice(n, size=n, p=weights)


def systematic_resample(weights: np.ndarray, n: int) -> np.ndarray:
    """Lower variance systematic resampling (preferred)."""
    positions = (np.arange(n) + np.random.uniform()) / n
    cumsum = np.cumsum(weights)
    return np.searchsorted(cumsum, positions)


def residual_resample(weights: np.ndarray, n: int) -> np.ndarray:
    """Residual resampling for very skewed weights."""
    counts = np.floor(weights * n).astype(int)
    residuals = weights * n - counts

    # Deterministic part
    indices = np.repeat(np.arange(n), counts)

    # Stochastic residual part
    n_residual = n - len(indices)
    if n_residual > 0:
        residual_indices = np.random.choice(
            n, size=n_residual, p=residuals/residuals.sum()
        )
        indices = np.concatenate([indices, residual_indices])

    return indices
```

## When to Use Particle Filters

**Good for:**
- Live event tracking (elections, sports)
- Non-linear state dynamics
- Multi-modal posterior distributions
- Sequential data arrival

**Consider alternatives when:**
- Batch processing is acceptable (use MCMC)
- Linear Gaussian dynamics (use Kalman filter)
- Very high dimensional state space
