import { describe, expect, it } from '@jest/globals'
import { emptyDraft, resolveDraft } from '../frontend/utils/orderDraft.js'

const market = (overrides = {}) => ({
  side: 'BUY',
  price: 50,
  cash: 10000,
  heldShares: 100,
  ...overrides,
})

describe('emptyDraft', () => {
  it('defaults to shares with an empty amount', () => {
    expect(emptyDraft()).toEqual({ unit: 'shares', amount: '' })
  })

  it('unit switch is a new draft not a conversion', () => {
    const sharesDraft = { unit: 'shares', amount: '10' }
    const switched = emptyDraft('dollars')

    expect(switched).toEqual({ unit: 'dollars', amount: '' })
    expect(switched.amount).not.toBe(sharesDraft.amount)
  })
})

describe('resolveDraft', () => {
  it('empty trim is empty', () => {
    expect(resolveDraft({ unit: 'shares', amount: '' }, market())).toEqual({
      status: 'empty',
    })
    expect(resolveDraft({ unit: 'dollars', amount: '   ' }, market())).toEqual({
      status: 'empty',
    })
  })

  it('shares ready', () => {
    expect(resolveDraft({ unit: 'shares', amount: '2' }, market({ price: 50 }))).toEqual({
      status: 'ready',
      shares: 2,
      notional: 100,
    })
  })

  it('dollars ready with notional === shares * price', () => {
    const resolution = resolveDraft(
      { unit: 'dollars', amount: '250' },
      market({ price: 50 })
    )

    expect(resolution.status).toBe('ready')
    expect(resolution.shares).toBe(5)
    expect(resolution.notional).toBe(resolution.shares * 50)
    expect(resolution.notional).toBe(250)
  })

  it('dollars at exact cash is ready', () => {
    const price = 3
    const cash = 10
    const resolution = resolveDraft(
      { unit: 'dollars', amount: '10' },
      market({ side: 'BUY', price, cash })
    )

    expect(resolution.status).toBe('ready')
    expect(resolution.notional).toBe(resolution.shares * price)
    expect(resolution.notional).toBeLessThanOrEqual(cash)
  })

  it('shares insufficient funds', () => {
    expect(
      resolveDraft(
        { unit: 'shares', amount: '10' },
        market({ side: 'BUY', price: 50, cash: 100 })
      )
    ).toEqual({ status: 'invalid', reason: 'Insufficient funds' })
  })

  it('dollars insufficient funds', () => {
    expect(
      resolveDraft(
        { unit: 'dollars', amount: '251' },
        market({ side: 'BUY', price: 50, cash: 250 })
      )
    ).toEqual({ status: 'invalid', reason: 'Insufficient funds' })
  })

  it('sell insufficient shares', () => {
    expect(
      resolveDraft(
        { unit: 'shares', amount: '11' },
        market({ side: 'SELL', price: 50, heldShares: 10 })
      )
    ).toEqual({ status: 'invalid', reason: 'Insufficient shares' })
  })

  it('junk suffix', () => {
    expect(resolveDraft({ unit: 'shares', amount: '1abc' }, market())).toEqual({
      status: 'invalid',
      reason: 'Quantity must be greater than 0',
    })
    expect(resolveDraft({ unit: 'dollars', amount: '1abc' }, market())).toEqual({
      status: 'invalid',
      reason: 'Amount must be greater than 0',
    })
  })

  it('non-positive', () => {
    expect(resolveDraft({ unit: 'shares', amount: '0' }, market())).toEqual({
      status: 'invalid',
      reason: 'Quantity must be greater than 0',
    })
    expect(resolveDraft({ unit: 'shares', amount: '-1' }, market())).toEqual({
      status: 'invalid',
      reason: 'Quantity must be greater than 0',
    })
    expect(resolveDraft({ unit: 'dollars', amount: '0' }, market())).toEqual({
      status: 'invalid',
      reason: 'Amount must be greater than 0',
    })
    expect(resolveDraft({ unit: 'dollars', amount: '-5' }, market())).toEqual({
      status: 'invalid',
      reason: 'Amount must be greater than 0',
    })
  })

  it('price 0', () => {
    expect(resolveDraft({ unit: 'shares', amount: '1' }, market({ price: 0 }))).toEqual({
      status: 'invalid',
      reason: 'Price unavailable',
    })
  })

  it('sub-minimum dollars', () => {
    expect(
      resolveDraft({ unit: 'dollars', amount: '0.0001' }, market({ price: 200 }))
    ).toEqual({ status: 'invalid', reason: 'Amount is too small' })
  })

  it('does not mutate the draft', () => {
    const draft = { unit: 'shares', amount: '2' }
    resolveDraft(draft, market())
    expect(draft).toEqual({ unit: 'shares', amount: '2' })
  })
})
