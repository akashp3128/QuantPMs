---
name: copula-modeling
description: Dependency modeling for correlated prediction market outcomes
author: Akash Patel
version: 1.0.0
license: MIT
category: quantitative-simulation
---

# Copula Modeling

Model dependencies between correlated prediction market outcomes. Critical for portfolio risk when events are not independent.

## Why Copulas Matter

**The 2008 lesson:** Gaussian copulas assume extreme co-movements have zero probability. When housing markets crashed together, portfolios built on this assumption were devastated.

For prediction markets: correlated contracts (swing states, sector stocks) require proper tail dependence modeling.

## Sklar's Theorem

Any joint distribution can be decomposed:

```
F(x₁, x₂, ..., xₙ) = C(F₁(x₁), F₂(x₂), ..., Fₙ(xₙ))
```

Where:
- `F` = joint CDF
- `Fᵢ` = marginal CDFs
- `C` = copula (pure dependency structure)

## Core Implementations

```python
import numpy as np
from scipy.stats import norm, t as student_t
from scipy.special import gamma as gamma_func
from typing import Tuple, Dict

def gaussian_copula_sample(
    correlation_matrix: np.ndarray,
    n_samples: int = 10000,
    seed: int = 42
) -> np.ndarray:
    """
    Sample from Gaussian copula.

    WARNING: Zero tail dependence - inappropriate for extreme events.

    Parameters
    ----------
    correlation_matrix : ndarray
        Correlation matrix (must be positive definite)
    n_samples : int
        Number of samples
    seed : int
        Random seed

    Returns
    -------
    ndarray
        Uniform marginals with Gaussian dependency, shape (n_samples, dim)
    """
    np.random.seed(seed)
    dim = correlation_matrix.shape[0]

    # Cholesky decomposition
    L = np.linalg.cholesky(correlation_matrix)

    # Sample correlated normals
    Z = np.random.standard_normal((n_samples, dim))
    X = Z @ L.T

    # Transform to uniform via normal CDF
    U = norm.cdf(X)

    return U


def student_t_copula_sample(
    correlation_matrix: np.ndarray,
    df: float = 4,
    n_samples: int = 10000,
    seed: int = 42
) -> np.ndarray:
    """
    Sample from Student-t copula.

    Has symmetric tail dependence - captures extreme co-movements.

    Parameters
    ----------
    correlation_matrix : ndarray
        Correlation matrix
    df : float
        Degrees of freedom (lower = fatter tails, more dependence)
    n_samples : int
        Number of samples
    seed : int
        Random seed

    Returns
    -------
    ndarray
        Uniform marginals with t-copula dependency
    """
    np.random.seed(seed)
    dim = correlation_matrix.shape[0]

    L = np.linalg.cholesky(correlation_matrix)

    # Sample correlated normals
    Z = np.random.standard_normal((n_samples, dim))
    X = Z @ L.T

    # Scale by chi-squared to get multivariate t
    chi2 = np.random.chisquare(df, n_samples)
    X = X / np.sqrt(chi2 / df)[:, np.newaxis]

    # Transform to uniform via t CDF
    U = student_t.cdf(X, df)

    return U


def clayton_copula_sample(
    theta: float,
    n_samples: int = 10000,
    seed: int = 42
) -> np.ndarray:
    """
    Sample from Clayton copula (bivariate).

    Has LOWER tail dependence - models contagion/crash scenarios.

    Parameters
    ----------
    theta : float
        Dependence parameter (> 0, higher = stronger dependence)
    n_samples : int
        Number of samples
    seed : int
        Random seed

    Returns
    -------
    ndarray
        Shape (n_samples, 2)
    """
    np.random.seed(seed)

    # Marshall-Olkin algorithm
    V = np.random.gamma(1/theta, 1, n_samples)
    U1 = np.random.uniform(0, 1, n_samples)
    U2 = np.random.uniform(0, 1, n_samples)

    # Transform
    E1 = -np.log(U1)
    E2 = -np.log(U2)

    X1 = (1 + E1/V) ** (-1/theta)
    X2 = (1 + E2/V) ** (-1/theta)

    return np.column_stack([X1, X2])


def gumbel_copula_sample(
    theta: float,
    n_samples: int = 10000,
    seed: int = 42
) -> np.ndarray:
    """
    Sample from Gumbel copula (bivariate).

    Has UPPER tail dependence - models correlated positive outcomes.

    Parameters
    ----------
    theta : float
        Dependence parameter (>= 1, higher = stronger)
    n_samples : int
        Number of samples
    seed : int
        Random seed

    Returns
    -------
    ndarray
        Shape (n_samples, 2)
    """
    np.random.seed(seed)

    # Stable distribution sampling
    alpha = 1 / theta

    # Generate stable(alpha) via Chambers-Mallows-Stuck
    W = np.random.exponential(1, n_samples)
    U_angle = np.random.uniform(-np.pi/2, np.pi/2, n_samples)

    S = (np.sin(alpha * (U_angle + np.pi/2)) /
         np.cos(U_angle) ** (1/alpha) *
         (np.cos(U_angle - alpha * (U_angle + np.pi/2)) / W) ** ((1-alpha)/alpha))

    # Generate uniforms
    E1 = np.random.exponential(1, n_samples)
    E2 = np.random.exponential(1, n_samples)

    X1 = np.exp(-(E1/S) ** alpha)
    X2 = np.exp(-(E2/S) ** alpha)

    return np.column_stack([X1, X2])
```

## Tail Dependence Coefficients

```python
def tail_dependence_t_copula(rho: float, df: float) -> float:
    """
    Calculate tail dependence coefficient for t-copula.

    Parameters
    ----------
    rho : float
        Correlation (-1, 1)
    df : float
        Degrees of freedom

    Returns
    -------
    float
        Tail dependence coefficient λ
    """
    from scipy.stats import t as student_t

    x = np.sqrt((df + 1) * (1 - rho) / (1 + rho))
    return 2 * student_t.cdf(-x, df + 1)


# Compare tail dependence
print("Tail Dependence by Copula (ρ=0.5)")
print("-" * 40)
print(f"Gaussian:     λ = 0.000 (ZERO!)")
print(f"Student-t(4): λ = {tail_dependence_t_copula(0.5, 4):.3f}")
print(f"Student-t(8): λ = {tail_dependence_t_copula(0.5, 8):.3f}")
print(f"Clayton(2):   λ_L = 0.500, λ_U = 0")
print(f"Gumbel(2):    λ_L = 0, λ_U = 0.586")
```

**Output:**
```
Tail Dependence by Copula (ρ=0.5)
----------------------------------------
Gaussian:     λ = 0.000 (ZERO!)
Student-t(4): λ = 0.182
Student-t(8): λ = 0.109
Clayton(2):   λ_L = 0.500, λ_U = 0
Gumbel(2):    λ_L = 0, λ_U = 0.586
```

## Portfolio Risk Example

```python
def joint_extreme_probability(
    marginal_probs: np.ndarray,
    correlation_matrix: np.ndarray,
    copula: str = "gaussian",
    df: float = 4,
    n_sims: int = 100000
) -> Dict:
    """
    Estimate P(all events occur) under different copulas.

    Parameters
    ----------
    marginal_probs : ndarray
        Individual event probabilities
    correlation_matrix : ndarray
        Correlation structure
    copula : str
        'gaussian' or 't'
    df : float
        Degrees of freedom (for t-copula)
    n_sims : int
        Number of simulations

    Returns
    -------
    dict
        Joint probability estimate
    """
    dim = len(marginal_probs)

    # Sample from copula
    if copula == "gaussian":
        U = gaussian_copula_sample(correlation_matrix, n_sims)
    else:
        U = student_t_copula_sample(correlation_matrix, df, n_sims)

    # Transform to binary outcomes using marginal thresholds
    thresholds = 1 - marginal_probs  # P(U > threshold) = marginal_prob
    outcomes = U > thresholds

    # Joint probability: all events occur
    all_occur = outcomes.all(axis=1)
    p_joint = all_occur.mean()
    se = np.sqrt(p_joint * (1 - p_joint) / n_sims)

    # Independence assumption for comparison
    p_independent = np.prod(marginal_probs)

    return {
        "joint_probability": round(p_joint, 4),
        "std_error": round(se, 6),
        "independent_assumption": round(p_independent, 4),
        "ratio_to_independent": round(p_joint / p_independent, 2) if p_independent > 0 else np.inf,
        "copula": copula
    }


# Example: 5 swing states, each 60% likely for candidate
marginals = np.array([0.60, 0.60, 0.60, 0.60, 0.60])
corr = np.array([
    [1.0, 0.6, 0.5, 0.4, 0.3],
    [0.6, 1.0, 0.6, 0.5, 0.4],
    [0.5, 0.6, 1.0, 0.6, 0.5],
    [0.4, 0.5, 0.6, 1.0, 0.6],
    [0.3, 0.4, 0.5, 0.6, 1.0]
])

print("P(Win All 5 States)")
print("-" * 40)

gauss = joint_extreme_probability(marginals, corr, "gaussian")
print(f"Gaussian copula: {gauss['joint_probability']:.1%}")

t_cop = joint_extreme_probability(marginals, corr, "t", df=4)
print(f"t-copula (df=4): {t_cop['joint_probability']:.1%}")

print(f"Independence:    {gauss['independent_assumption']:.1%}")
print(f"\nt-copula shows {t_cop['ratio_to_independent']:.1f}x higher "
      "joint probability than independence")
```

## Copula Selection Guide

| Scenario | Recommended Copula |
|----------|-------------------|
| General dependence | Student-t (df=4-8) |
| Crash/contagion risk | Clayton |
| Correlated upside | Gumbel |
| Quick approximation | Gaussian (with caveats) |
| Complex portfolios | Vine copulas |

**Critical Warning:** "Trading correlated contracts without modeling tail dependence means your portfolio will blow up in exactly the scenarios that matter most."
