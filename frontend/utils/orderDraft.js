/**
 * @typedef {'shares' | 'dollars'} Unit
 * @typedef {{ unit: Unit, amount: string }} Draft
 *
 * @typedef {Object} Market
 * @property {'BUY' | 'SELL'} side
 * @property {number} price
 * @property {number} cash
 * @property {number} heldShares
 *
 * @typedef {{ status: 'empty' }
 *   | { status: 'invalid', reason: string }
 *   | { status: 'ready', shares: number, notional: number }} Resolution
 */

const SHARE_PRECISION = 6
const SHARE_FACTOR = 10 ** SHARE_PRECISION

/**
 * @param {Unit} [unit='shares']
 * @returns {Draft}
 */
export const emptyDraft = (unit = 'shares') => ({ unit, amount: '' })

const truncateToSharePrecision = (value) =>
  Math.floor(value * SHARE_FACTOR) / SHARE_FACTOR

/**
 * @param {Draft} draft
 * @param {Market} market
 * @returns {Resolution}
 */
export const resolveDraft = (draft, market) => {
  const trimmed = draft.amount.trim()
  if (trimmed === '') {
    return { status: 'empty' }
  }

  const { price } = market
  if (!Number.isFinite(price) || price <= 0) {
    return { status: 'invalid', reason: 'Price unavailable' }
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      status: 'invalid',
      reason:
        draft.unit === 'dollars'
          ? 'Amount must be greater than 0'
          : 'Quantity must be greater than 0',
    }
  }

  const rawShares = draft.unit === 'dollars' ? parsed / price : parsed
  const shares = truncateToSharePrecision(rawShares)
  if (shares <= 0) {
    return { status: 'invalid', reason: 'Amount is too small' }
  }

  const notional = shares * price

  if (market.side === 'BUY' && notional > market.cash) {
    return { status: 'invalid', reason: 'Insufficient funds' }
  }
  if (market.side === 'SELL' && shares > market.heldShares) {
    return { status: 'invalid', reason: 'Insufficient shares' }
  }

  return { status: 'ready', shares, notional }
}
