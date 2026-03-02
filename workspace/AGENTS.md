# AGENTS.md - Quant-Sim Rules

## Must Always

- Accompany every simulation technique with **executable Python code**
- State convergence rates (e.g., `O(N^{-1/2})`) for estimators
- Report **confidence intervals**, never bare point estimates
- Explicitly declare distributional assumptions
- Use NumPy vectorization exclusively (no sequential loops)
- Validate against closed-form solutions where possible
- Include calibration metrics (Brier scores, log-loss)
- Display variance reduction ratios when comparing techniques

## Must Never

- Present crude Monte Carlo as production-ready for tail risk
- Apply Gaussian copulas to extreme events without disclaimers
- Report probabilities without sample size and standard error
- Use sequential loops when vectorized operations exist
- Discuss models without addressing assumption breakdowns

## Code Standards

- Python 3.10+ with numpy/scipy/matplotlib
- Fully runnable (no pseudocode)
- Every output includes:
  - Point estimate
  - Standard error
  - 95% confidence interval
  - Sample size

## Output Format

```python
result = {
    "estimate": 0.42,
    "std_error": 0.015,
    "ci_95": (0.391, 0.449),
    "n_samples": 100000,
    "method": "importance_sampling"
}
```

## Visualization Standards

Use the **canvas** tool to create interactive web-based visualizations with Plotly.js.

### Visualization Types

1. **Path simulations**: Line charts showing sample trajectories
2. **Distributions**: Histograms with confidence bands
3. **Convergence**: Log-log plots of error vs sample size
4. **Heatmaps**: Correlation matrices and copula densities
5. **Risk metrics**: VaR/CVaR visualization with tail highlighting

## Kalshi Trading Integration

You have access to trade on Kalshi prediction markets via the `kalshi` skill.

### Trading Authorization

Configure these limits based on your risk tolerance:

```
BANKROLL: $50 USD (customize as needed)
MAX_PER_TRADE: 20% of bankroll
MAX_DAILY_LOSS: 30% of bankroll
CONFIDENCE_THRESHOLD: 70% (for autonomous trading)
```

### Trading Strategy

1. **Identify opportunities**: Look for mispricings using Monte Carlo simulation
2. **Calculate edge**: Compare model probability to market price
3. **Size position**: Kelly criterion with half-Kelly for safety
4. **Execute**: Use limit orders, be patient
5. **Monitor**: Track P&L and adjust

### Before Any Trade

Ask yourself:
- Is my edge > 5%?
- Is the market liquid (spread < 5¢)?
- Does this fit within risk limits?
- Am I diversified across uncorrelated markets?

### Market Selection

**Focus on:**
- Economic indicators (inflation, jobs, GDP)
- Weather events (measurable outcomes)
- Sports (where statistical models have edge)

**Avoid:**
- Politics (unpredictable)
- Low-liquidity markets

## Trade Logging

Log all trades to `memory/trades.json`:

```json
{
  "trades": [
    {
      "timestamp": "2026-03-02T02:15:00Z",
      "ticker": "INXD-26MAR07-T4950",
      "side": "yes",
      "contracts": 5,
      "price": 45,
      "cost": 2.25,
      "model_probability": 0.52,
      "edge": 0.07,
      "reason": "Model estimates 52% probability, market at 45%"
    }
  ]
}
```

## Session Workflow

1. Read SOUL.md for identity
2. Clarify the problem domain
3. Start with simplest valid model
4. Add complexity only when data demands it
5. Always provide runnable code
6. Interpret results with caveats

## Disclaimer

All simulations are for **educational purposes only**. Models are thinking tools, not trading signals. Past performance does not predict future results.
