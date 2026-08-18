import { describe, expect, it } from '@jest/globals';
import {
  DENOM,
  emptyDraft,
  formatShares,
  resolveOrder,
  withAmount,
  withDenomination,
} from '../frontend/utils/orderDraft.js';

const TERMS = { side: 'BUY', price: 153.5, cash: 1000, shares: 0 };

const draft = (amount, denomination = DENOM.SHARES) => ({ denomination, amount });

const round2 = (value) => Math.round(value * 100) / 100;

describe('emptyDraft', () => {
  it('defaults to SHARES with an empty amount', () => {
    expect(emptyDraft()).toEqual({ denomination: DENOM.SHARES, amount: '' });
  });
});

describe('resolveOrder — shares denomination', () => {
  it('EMPTY for blank input, with no error', () => {
    const order = resolveOrder(draft(''), TERMS);
    expect(order).toMatchObject({
      status: 'EMPTY',
      shares: 0,
      notional: 0,
      error: '',
      canConfirm: false,
    });
  });

  it('READY for "2", shares 2 and notional 307.00', () => {
    const order = resolveOrder(draft('2'), TERMS);
    expect(order).toMatchObject({
      status: 'READY',
      shares: 2,
      notional: 307,
      error: '',
      canConfirm: true,
    });
  });

  it.each(['abc', '0', '-3'])('INVALID for %j', (amount) => {
    const order = resolveOrder(draft(amount), TERMS);
    expect(order.status).toBe('INVALID');
    expect(order.error).toBe('Enter an amount greater than 0');
    expect(order.canConfirm).toBe(false);
    expect(order.shares).toBe(0);
    expect(order.notional).toBe(0);
  });

  it('"1.5abc" is INVALID', () => {
    const order = resolveOrder(draft('1.5abc'), TERMS);
    expect(order.status).toBe('INVALID');
    expect(order.error).toBe('Enter an amount greater than 0');
    expect(order.shares).toBe(0);
  });

  it('floors over-precise entry: "1.23456789" -> 1.234567', () => {
    const order = resolveOrder(draft('1.23456789'), TERMS);
    expect(order.shares).toBe(1.234567);
    expect(order.notional).toBe(round2(1.234567 * TERMS.price));
  });

  it('BLOCKED "Insufficient funds" when notional exceeds cash, but still reports shares and notional', () => {
    const order = resolveOrder(draft('100'), TERMS);
    expect(order.status).toBe('BLOCKED');
    expect(order.error).toBe('Insufficient funds');
    expect(order.shares).toBe(100);
    expect(order.notional).toBe(15350);
    expect(order.canConfirm).toBe(false);
  });

  it('BLOCKED "Insufficient shares" on SELL beyond the holding', () => {
    const order = resolveOrder(draft('5'), { ...TERMS, side: 'SELL', shares: 2 });
    expect(order.status).toBe('BLOCKED');
    expect(order.error).toBe('Insufficient shares');
    expect(order.shares).toBe(5);
    expect(order.notional).toBe(round2(5 * TERMS.price));
  });

  it('READY when selling exactly the held quantity (epsilon tolerance)', () => {
    const held = 2;
    const exact = resolveOrder(draft('2'), { ...TERMS, side: 'SELL', shares: held });
    expect(exact.status).toBe('READY');
    expect(exact.error).toBe('');

    const ulpOver = resolveOrder(draft('2'), {
      ...TERMS,
      side: 'SELL',
      shares: held - 5e-10,
    });
    expect(ulpOver.status).toBe('READY');
  });
});

describe('resolveOrder — dollars denomination', () => {
  it('"500" at 153.50 -> 3.257328 shares', () => {
    const order = resolveOrder(draft('500', DENOM.DOLLARS), TERMS);
    expect(order.shares).toBe(3.257328);
    expect(order.status).toBe('READY');
  });

  it('notional is round2(shares * price), never the typed dollars', () => {
    const order = resolveOrder(
      draft('100.009', DENOM.DOLLARS),
      { ...TERMS, price: 10000, cash: 1000 }
    );
    expect(order.shares).toBe(0.01);
    expect(order.notional).toBe(round2(order.shares * 10000));
    expect(order.notional).toBe(100);
    expect(order.notional).not.toBe(100.009);
  });

  it('notional never exceeds the typed dollars, for a table of awkward prices', () => {
    const cases = [
      { dollars: '100', price: 0.1 },
      { dollars: '250', price: 3.33 },
      { dollars: '250.00', price: 7.11 },
      { dollars: '500', price: 13.37 },
      { dollars: '1000', price: 49.99 },
      { dollars: '1000', price: 99.99 },
      { dollars: '1000', price: 153.5 },
      { dollars: '100.009', price: 10000 },
    ];

    for (const { dollars, price } of cases) {
      const order = resolveOrder(
        draft(dollars, DENOM.DOLLARS),
        { ...TERMS, price, cash: 1e9 }
      );
      expect(order.notional).toBe(round2(order.shares * price));
      expect(order.notional).toBeLessThanOrEqual(Number(dollars));
    }
  });

  it('spending exactly cash is READY: 1000 at 153.50 -> 6.514657 shares, 999.99985 <= cash', () => {
    const order = resolveOrder(draft('1000', DENOM.DOLLARS), TERMS);
    expect(order.shares).toBe(6.514657);
    expect(order.shares * TERMS.price).toBeLessThanOrEqual(TERMS.cash);
    expect(order.notional).toBeLessThanOrEqual(TERMS.cash);
    expect(order.status).toBe('READY');
  });

  it('INVALID when the amount is below one MIN_SHARES of price (dust)', () => {
    const order = resolveOrder(draft('0.0001', DENOM.DOLLARS), TERMS);
    expect(order.status).toBe('INVALID');
    expect(order.error).toBe('Amount is too small to trade');
    expect(order.canConfirm).toBe(false);
  });

  it('INVALID when price is 0 or NaN, rather than Infinity shares', () => {
    for (const price of [0, NaN, -1, Infinity]) {
      const order = resolveOrder(draft('500', DENOM.DOLLARS), { ...TERMS, price });
      expect(order.status).toBe('INVALID');
      expect(order.error).toBe('Price unavailable. Try again');
      expect(order.shares).toBe(0);
      expect(Number.isFinite(order.shares)).toBe(true);
    }
  });

  it('dollar sell over holdings is Insufficient shares, not Insufficient funds', () => {
    const order = resolveOrder(
      draft('50', DENOM.DOLLARS),
      { side: 'SELL', price: 10, cash: 10000, shares: 2 }
    );
    expect(order.shares).toBe(5);
    expect(order.status).toBe('BLOCKED');
    expect(order.error).toBe('Insufficient shares');
    expect(order.error).not.toBe('Insufficient funds');
  });
});

describe('withAmount', () => {
  it('strips $ , and whitespace: "$1,200.00" -> "1200.00"', () => {
    expect(withAmount(emptyDraft(), '$1,200.00').amount).toBe('1200.00');
  });

  it('drops letters, keeps a single decimal point', () => {
    expect(withAmount(emptyDraft(), '1.5abc').amount).toBe('1.5');
    expect(withAmount(emptyDraft(), '12.3.4').amount).toBe('12.34');
  });

  it('preserves mid-typing states "" and "0."', () => {
    expect(withAmount(emptyDraft(), '').amount).toBe('');
    expect(withAmount(emptyDraft(), '0.').amount).toBe('0.');
  });
});

describe('withDenomination', () => {
  it('SHARES->DOLLARS formats shares * price to 2dp', () => {
    const next = withDenomination(draft('2'), DENOM.DOLLARS, TERMS);
    expect(next.denomination).toBe(DENOM.DOLLARS);
    expect(next.amount).toBe('307');
  });

  it('DOLLARS->SHARES floors dollars / price to 6dp', () => {
    const next = withDenomination(draft('500', DENOM.DOLLARS), DENOM.SHARES, TERMS);
    expect(next.denomination).toBe(DENOM.SHARES);
    expect(next.amount).toBe('3.257328');
  });

  it('returns the same object reference for the active denomination', () => {
    const original = draft('2');
    expect(withDenomination(original, DENOM.SHARES, TERMS)).toBe(original);
  });

  it('clears the amount when the price is unusable', () => {
    expect(withDenomination(draft('2'), DENOM.DOLLARS, { ...TERMS, price: 0 })).toEqual({
      denomination: DENOM.DOLLARS,
      amount: '',
    });
    expect(withDenomination(draft('abc'), DENOM.DOLLARS, TERMS)).toEqual({
      denomination: DENOM.DOLLARS,
      amount: '',
    });
  });

  it('round-trips within one unit of precision, and never upward', () => {
    const asShares = withDenomination(draft('500', DENOM.DOLLARS), DENOM.SHARES, TERMS);
    const backToDollars = withDenomination(asShares, DENOM.DOLLARS, TERMS);
    expect(Number(backToDollars.amount)).toBeLessThanOrEqual(500);

    const asDollars = withDenomination(draft('2'), DENOM.DOLLARS, TERMS);
    const backToShares = withDenomination(asDollars, DENOM.SHARES, TERMS);
    expect(Number(backToShares.amount)).toBeLessThanOrEqual(2);
  });

  it('carries no error across: a BLOCKED draft flipped to a valid size is READY', () => {
    const blockedDraft = draft('100');
    expect(resolveOrder(blockedDraft, TERMS).status).toBe('BLOCKED');

    const flipped = withAmount(blockedDraft, '1');
    const order = resolveOrder(flipped, TERMS);
    expect(order.status).toBe('READY');
    expect(order.error).toBe('');
    expect(order.canConfirm).toBe(true);
  });
});

describe('formatShares', () => {
  it('formats up to 6 fraction digits', () => {
    expect(formatShares(3.257328)).toBe('3.257328');
    expect(formatShares(2)).toBe('2');
  });
});
