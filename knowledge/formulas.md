# Key Formulas

## Monte Carlo Estimation

### Basic Estimator
```
p̂_N = (1/N) × Σ 1_A(X_i)
```

**Convergence Rate:** `O(N^{-1/2})`

### Sample Size for Target Precision
```
N = z²_{α/2} × p(1-p) / ε²
```

Where:
- `z_{α/2} = 1.96` for 95% confidence
- `ε` = desired margin of error
- `p` = estimated probability (use 0.5 if unknown)

### Standard Error
```
SE = √(p̂(1-p̂) / N)
```

### 95% Confidence Interval
```
CI = p̂ ± 1.96 × SE
```

---

## Geometric Brownian Motion

### Continuous Form
```
dS = μS dt + σS dW
```

### Discrete Simulation
```
S_T = S_0 × exp((μ - 0.5σ²)T + σ√T × Z)
```

Where:
- `S_0` = initial price
- `μ` = drift (expected return)
- `σ` = volatility
- `T` = time horizon
- `Z ~ N(0,1)`

---

## Variance Reduction

### Importance Sampling
```
E_P[f(X)] = E_Q[f(X) × (dP/dQ)]
```

**Optimal Tilting Parameter (Exponential):**
```
θ* = argmin Var_Q[f(X) × exp(θX - ψ(θ))]
```

### Antithetic Variates
```
Ŷ = (f(Z) + f(-Z)) / 2
```

**Variance Reduction:** ~50-75% for monotone payoffs

### Control Variates
```
Ŷ_cv = Ŷ - β(X̄ - E[X])
```

Where `β = Cov(Y,X) / Var(X)`

---

## Position Sizing

### Kelly Criterion
```
f* = (p × b - q) / b
```

Where:
- `p` = probability of winning
- `q = 1 - p`
- `b` = odds (payout ratio)

### Half-Kelly (Recommended)
```
f = f* × 0.5
```

---

## Calibration Metrics

### Brier Score
```
BS = (1/N) × Σ(p_i - o_i)²
```

Where:
- `p_i` = predicted probability
- `o_i` = actual outcome (0 or 1)

**Interpretation:**
- `BS < 0.10` = Excellent
- `BS < 0.25` = Good
- `BS > 0.25` = Poor

### Log Loss
```
LL = -(1/N) × Σ[o_i × log(p_i) + (1-o_i) × log(1-p_i)]
```

---

## Copula Tail Dependence

### Upper Tail Dependence
```
λ_U = lim_{u→1} P(U > u | V > u)
```

### Lower Tail Dependence
```
λ_L = lim_{u→0} P(U < u | V < u)
```

**By Copula Family:**

| Copula | λ_L | λ_U |
|--------|-----|-----|
| Gaussian | 0 | 0 |
| Student-t (ν=4) | ~0.18 | ~0.18 |
| Clayton | > 0 | 0 |
| Gumbel | 0 | > 0 |

---

## Particle Filter

### Effective Sample Size
```
ESS = 1 / Σ w_i²
```

**Resample when:** `ESS < N/2`

### Logit Random Walk (State Evolution)
```
logit(p_{t+1}) = logit(p_t) + ε_t,  ε_t ~ N(0, σ²_process)
```

---

## Market Microstructure

### Kyle's Lambda (Price Impact)
```
λ = σ_v / (2 × σ_u)
```

Where:
- `σ_v` = informed trader volatility
- `σ_u` = noise trader volatility

### Bid-Ask Spread
```
spread = 2 × λ × E[|order_flow|]
```

---

## Edge Calculation

### Trading Edge
```
Edge = P_model - P_market
```

**Trade if:** `Edge > 0.05` (5%)

### Expected Value per Contract
```
EV = Edge × $1.00 (contract payout)
```
