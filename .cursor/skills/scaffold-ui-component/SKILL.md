---
name: scaffold-ui-component
description: Scaffolds a new React JSX component under frontend/components using atomic design (atoms, molecules, organisms), Tailwind classes, default exports, and project rules such as formatCurrency for money. Use when adding UI, creating a new atom/molecule/organism, or when the user asks to scaffold a component.
---

# Scaffold UI Component (Stock Demo)

## Layer choice

| Layer | Path | Use for |
|-------|------|---------|
| **atom** | `frontend/components/atoms/` | Single-purpose primitives (button, input, badge) with little or no domain logic |
| **molecule** | `frontend/components/molecules/` | Composed widgets combining atoms; local UI state |
| **organism** | `frontend/components/organisms/` | Sections that compose molecules/atoms, context, or routing |

If unsure, use **molecule** and extract an atom later if it repeats.

## File and naming

- **File**: `frontend/components/{atoms|molecules|organisms}/<PascalCase>.jsx`
- **Component name** matches filename (e.g. `RiskBadge.jsx` exports `RiskBadge`).
- **Export**: `export default ComponentName` (matches existing components).
- **No barrel** `index.js` — import the file path from consumers (Vite resolves `.jsx`).

## Import paths (from `frontend/`)

| From | To utils | To atoms | To molecules |
|------|----------|----------|--------------|
| `atoms/`, `molecules/`, `organisms/` | `../../utils/calculations` | `../atoms/Name` | `../molecules/Name` |
| `pages/` | `../utils/calculations` | `../components/atoms/Name` | `../components/molecules/Name` |

## Currency and numbers

Per project rules, **always** use `formatCurrency` from `../../utils/calculations` for prices, totals, and P&L. Use `formatPercentage` / `formatNumber` from the same module when the UI shows those values.

## Templates

**Atom** (minimal):

```jsx
const ComponentName = ({
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={`rounded-lg border border-gray-700 bg-gray-800 text-gray-100 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export default ComponentName
```

**Molecule / organism** (with optional currency):

```jsx
import { formatCurrency } from '../../utils/calculations'

const ComponentName = ({
  className = '',
  title,
  amount,
}) => {
  return (
    <section className={`rounded-lg border border-gray-700 bg-gray-800 p-4 ${className}`}>
      <h2 className="text-sm font-medium text-gray-400">{title}</h2>
      <p className="mt-1 text-lg font-semibold text-white">
        {amount != null ? formatCurrency(amount) : '—'}
      </p>
    </section>
  )
}

export default ComponentName
```

Adjust the root element (`section`, `article`, `div`) and Tailwind tokens to match neighboring components (e.g. `StockCard`, `Button`).

## After creating the file

1. **Wire it up** — add an import in the page or parent organism (path like `../components/atoms/ComponentName`).
2. **Accessibility** — interactive elements need labels, `type` on `<button>`, and focus styles (`focus:ring-*` / `focus:outline-none` as in `Button.jsx`).
3. **Verify** — `npm run lint` from repo root.

## Adapting for other repos

Change `frontend/components/...` and import depths to match that project’s tree; keep the layer decision table and the “wire up + lint” checklist.
