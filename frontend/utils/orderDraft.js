/**
 * @typedef {'SHARES' | 'DOLLARS'} Denomination
 */

/**
 * @typedef {Object} OrderDraft
 * @property {Denomination} denomination
 * @property {string} amount
 */

/**
 * @typedef {Object} TradeTerms
 * @property {'BUY' | 'SELL'} side
 * @property {number} price
 * @property {number} cash
 * @property {number} shares
 */

/**
 * @typedef {'EMPTY' | 'INVALID' | 'BLOCKED' | 'READY'} OrderStatus
 */

/**
 * @typedef {Object} ResolvedOrder
 * @property {OrderStatus} status
 * @property {number} shares
 * @property {number} notional
 * @property {string} error
 * @property {boolean} canConfirm
 */

/** @type {{ SHARES: 'SHARES', DOLLARS: 'DOLLARS' }} */
export const DENOM = Object.freeze({ SHARES: 'SHARES', DOLLARS: 'DOLLARS' })

const SHARE_DECIMALS = 6
const MIN_SHARES = 1e-6
const SHARE_EPSILON = 1e-9
const DECIMAL_RE = /^(?:\d+\.?\d*|\.\d+)$/

const usablePrice = (price) => Number.isFinite(price) && price > 0

const floorTo = (value, decimals) => {
  const factor = 10 ** decimals
  return Math.floor((value + 1e-9) * factor) / factor
}

const roundTo = (value, decimals) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const parseDecimal = (amount) => {
  const normalized = String(amount).replace(/[$,\s]/g, '')
  if (!DECIMAL_RE.test(normalized)) return NaN
  return Number(normalized)
}

const amountString = (value, decimals) => Number(value.toFixed(decimals)).toString()

const sharesFromDollars = (dollars, price) => floorTo(dollars / price, SHARE_DECIMALS)

const exceedsHolding = (shares, held) => shares > held + SHARE_EPSILON

const resolved = (status, shares, notional, error) => ({
  status,
  shares,
  notional,
  error,
  canConfirm: status === 'READY',
})

/**
 * @param {Denomination} [denomination]
 * @returns {OrderDraft}
 */
export const emptyDraft = (denomination = DENOM.SHARES) => ({
  denomination,
  amount: '',
})

/**
 * @param {OrderDraft} draft
 * @param {string} rawText
 * @returns {OrderDraft}
 */
export const withAmount = (draft, rawText) => {
  let cleaned = String(rawText).replace(/[$,\s]/g, '').replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return { ...draft, amount: cleaned }
}

/**
 * @param {OrderDraft} draft
 * @param {Denomination} denomination
 * @param {TradeTerms} terms
 * @returns {OrderDraft}
 */
export const withDenomination = (draft, denomination, terms) => {
  if (denomination === draft.denomination) return draft

  const value = parseDecimal(draft.amount)
  if (!Number.isFinite(value) || !usablePrice(terms.price)) {
    return { denomination, amount: '' }
  }

  if (denomination === DENOM.DOLLARS) {
    const shares = floorTo(value, SHARE_DECIMALS)
    return { denomination, amount: amountString(roundTo(shares * terms.price, 2), 2) }
  }

  return {
    denomination,
    amount: amountString(sharesFromDollars(value, terms.price), SHARE_DECIMALS),
  }
}

/**
 * @param {OrderDraft} draft
 * @param {TradeTerms} terms
 * @returns {ResolvedOrder}
 */
export const resolveOrder = (draft, terms) => {
  if (String(draft.amount).replace(/[$,\s]/g, '') === '') {
    return resolved('EMPTY', 0, 0, '')
  }

  const value = parseDecimal(draft.amount)
  if (!Number.isFinite(value) || value <= 0) {
    return resolved('INVALID', 0, 0, 'Enter an amount greater than 0')
  }

  if (!usablePrice(terms.price)) {
    return resolved('INVALID', 0, 0, 'Price unavailable. Try again')
  }

  const shares = draft.denomination === DENOM.SHARES
    ? floorTo(value, SHARE_DECIMALS)
    : sharesFromDollars(value, terms.price)

  if (shares < MIN_SHARES) {
    return resolved('INVALID', 0, 0, 'Amount is too small to trade')
  }

  const notional = roundTo(shares * terms.price, 2)

  if (terms.side === 'BUY' && notional > terms.cash) {
    return resolved('BLOCKED', shares, notional, 'Insufficient funds')
  }

  if (terms.side === 'SELL' && exceedsHolding(shares, terms.shares)) {
    return resolved('BLOCKED', shares, notional, 'Insufficient shares')
  }

  return resolved('READY', shares, notional, '')
}

/**
 * @param {number} shares
 * @returns {string}
 */
export const formatShares = (shares) => (
  new Intl.NumberFormat('en-US', { maximumFractionDigits: SHARE_DECIMALS }).format(shares)
)
