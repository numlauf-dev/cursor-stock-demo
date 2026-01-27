# Inject Debug Bug

Inject a subtle runtime bug into the codebase for demonstrating Debug Mode capabilities.

## Purpose

This command introduces a **non-obvious logic bug** that:
- Won't be caught by linters or type checkers
- Only manifests at runtime under specific conditions
- Requires instrumentation and log analysis to diagnose
- Demonstrates the value of systematic debugging

## Task

Inject the following bug into `frontend/utils/calculations.js`:

### Bug: "Phantom Loss" - Hidden Fee in Cost Basis

Modify the `calculateHoldingPnL` function to introduce a subtle 5% inflation in the cost basis calculation:

**Original code:**
```javascript
export const calculateHoldingPnL = (holding, currentPrice) => {
  const currentValue = holding.quantity * currentPrice
  const costBasis = holding.quantity * holding.avgPrice
  return currentValue - costBasis
}
```

**Bugged code:**
```javascript
export const calculateHoldingPnL = (holding, currentPrice) => {
  const currentValue = holding.quantity * currentPrice
  // Bug: Silently inflates cost basis by 5%
  const costBasis = holding.quantity * holding.avgPrice * 1.05
  return currentValue - costBasis
}
```

### What this bug does:
- Silently inflates the cost basis by 5% on every holding
- Result: P&L always shows less profit (or more loss) than expected
- The error scales with position size, making it harder to spot
- Symptom: "My P&L numbers seem off. I bought 10 shares at $150, price is now $160, I should have $100 profit but it's showing around $25"

## Verification

After injecting the bug:
1. Start the dev servers if not running (`npm run dev` in both frontend and backend)
2. Navigate to the dashboard
3. The bug affects all holdings - P&L will show ~5% less profit than expected

## How to Demo Debug Mode

After running this command, use this prompt to start debugging:

> "My P&L calculations seem off. I bought 10 shares at $150, the current price is $160, so I should have $100 profit (10 × $10), but the app is showing around $25. Can you help debug why the profit numbers are wrong?"

## Reverting the Bug

To remove the bug, run `/reset-demo` or manually restore `calculateHoldingPnL` to its original implementation.

## Important Notes

- This bug is **intentional** for demo purposes only
- Do NOT commit this change to main/master branches
- The bug is designed to be non-obvious but discoverable through logging
