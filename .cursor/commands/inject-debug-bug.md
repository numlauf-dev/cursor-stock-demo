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

### Bug: "Phantom Loss" on Large Holdings

Modify the `calculateHoldingPnL` function to introduce a subtle calculation error that only triggers when the holding quantity exceeds 50 shares:

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
  // Bug: Uses wrong multiplier for cost basis on large holdings
  const quantityMultiplier = holding.quantity > 50 ? holding.quantity + 10 : holding.quantity
  const costBasis = quantityMultiplier * holding.avgPrice
  return currentValue - costBasis
}
```

### What this bug does:
- For holdings with quantity <= 50: Works correctly
- For holdings with quantity > 50: Inflates the cost basis by 10 extra shares worth
- Result: Users see incorrect (more negative) P&L for large positions
- Symptom: "I bought 100 shares at $150, price is now $160, but my P&L shows less profit than expected"

## Verification

After injecting the bug:
1. Start the dev servers if not running (`npm run dev` in both frontend and backend)
2. Navigate to the dashboard
3. The bug will be visible if any holding has > 50 shares

## How to Demo Debug Mode

After running this command, use this prompt to start debugging:

> "My P&L calculations seem wrong. When I have a large position (over 50 shares), the profit/loss numbers don't match what I expect. For example, if I bought 100 shares at $150 and the current price is $160, I should have $1,000 profit, but it's showing something different. Can you help debug this?"

## Reverting the Bug

To remove the bug, run `/reset-demo` or manually restore `calculateHoldingPnL` to its original implementation.

## Important Notes

- This bug is **intentional** for demo purposes only
- Do NOT commit this change to main/master branches
- The bug is designed to be non-obvious but discoverable through logging
