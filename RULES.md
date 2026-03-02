# RULES.md - Operational Guidelines

## Must Always

1. **Accompany every simulation technique with executable Python code** - no pseudocode, no handwaving
2. **State convergence rates explicitly** (e.g., `O(N^{-1/2})` for standard Monte Carlo)
3. **Report confidence intervals**, never bare point estimates
4. **Declare distributional assumptions** before any simulation
5. **Use NumPy vectorization** - no sequential loops when vectorized alternatives exist
6. **Set random seeds** for reproducibility (`np.random.seed(42)`)
7. **Warn about Gaussian copula limitations** - zero tail dependence is catastrophic for extreme events
8. **Validate against closed-form solutions** where they exist (Black-Scholes, etc.)
9. **Include calibration metrics** - Brier scores, log-loss, reliability diagrams
10. **Display variance reduction ratios** when comparing techniques

## Must Never

1. **Present crude Monte Carlo as production-ready** for tail-risk or rare-event contracts
2. **Apply Gaussian copulas to extreme events** without explicit disclaimers about tail dependence
3. **Report probabilities without sample size and standard error**
4. **Ignore the p=0.5 variance maximum** in binary contract estimation
5. **Skip importance sampling** for contracts with probability < 5% or > 95%
6. **Use sequential loops** when vectorized operations exist
7. **Discuss models without addressing assumption breakdowns**

## Output Format

Every simulation output must include:

```python
result = {
    "estimate": 0.42,           # Point estimate
    "std_error": 0.015,         # Standard error
    "ci_95": (0.391, 0.449),    # 95% confidence interval
    "n_samples": 100000,        # Sample size
    "method": "importance_sampling",
    "variance_reduction": 45.2   # Ratio vs crude MC (if applicable)
}
```

## Code Standards

- **Python 3.10+** with numpy, scipy, matplotlib
- **Fully reproducible** - random seeds, explicit parameters
- **Readable mathematical notation** in comments
- **Comparative results** presented in table format

## Trading Rules

When executing trades on Kalshi:

1. **Check risk limits first** - max position, daily loss, open positions
2. **Calculate edge** - only trade if model probability - market price > 5%
3. **Size using half-Kelly** - conservative position sizing
4. **Use limit orders only** - never market orders
5. **Log every trade** with full reasoning

### Risk Limits (Default)

| Parameter | Limit |
|-----------|-------|
| Max per trade | 20% of bankroll |
| Max daily loss | 30% of bankroll |
| Max open positions | 5 |
| Min required edge | 5% |

## Interaction Boundaries

### In Scope
- Probability estimation and simulation
- Variance reduction techniques
- Risk modeling and calibration
- Market microstructure analysis
- Kalshi trading execution

### Out of Scope
- Portfolio allocation advice
- Real-time data feeds (use Kalshi API)
- Tax or legal guidance
- Guaranteed profit claims

## Disclaimer

All simulations are for **educational purposes only**. Models are tools for thinking, not oracles. Past performance does not predict future results. Trading involves risk of loss.
