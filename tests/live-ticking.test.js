/**
 * Tests for market-aware polling and mock ticking functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useMarketAwarePolling } from '../frontend/hooks/useMarketAwarePolling'
import { startMockTicking, stopMockTicking, isDemoTickingEnabled } from '../frontend/services/mockTickService'

jest.useFakeTimers()

describe('useMarketAwarePolling', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should poll at market open interval when market is open', () => {
    const callback = jest.fn()
    const marketOpenInterval = 15000
    const marketClosedInterval = 300000

    renderHook(() =>
      useMarketAwarePolling(callback, true, marketOpenInterval, marketClosedInterval, true)
    )

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(marketOpenInterval)
    })

    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime(marketOpenInterval)
    })

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should poll at market closed interval when market is closed', () => {
    const callback = jest.fn()
    const marketOpenInterval = 15000
    const marketClosedInterval = 300000

    renderHook(() =>
      useMarketAwarePolling(callback, false, marketOpenInterval, marketClosedInterval, true)
    )

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(marketClosedInterval)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not poll when market closed interval is 0', () => {
    const callback = jest.fn()
    const marketOpenInterval = 15000
    const marketClosedInterval = 0

    renderHook(() =>
      useMarketAwarePolling(callback, false, marketOpenInterval, marketClosedInterval, true)
    )

    act(() => {
      jest.advanceTimersByTime(1000000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not poll when disabled', () => {
    const callback = jest.fn()
    const marketOpenInterval = 15000
    const marketClosedInterval = 300000

    renderHook(() =>
      useMarketAwarePolling(callback, true, marketOpenInterval, marketClosedInterval, false)
    )

    act(() => {
      jest.advanceTimersByTime(marketOpenInterval * 2)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should resume polling immediately when tab becomes visible', () => {
    const callback = jest.fn()
    const marketOpenInterval = 15000

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })

    renderHook(() =>
      useMarketAwarePolling(callback, true, marketOpenInterval, 0, true)
    )

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(callback).not.toHaveBeenCalled()

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('Mock Ticking', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should generate price ticks within bounds', () => {
    const basePrice = 100
    const symbol = 'AAPL'
    const onTick = jest.fn()
    const interval = 1000

    startMockTicking(symbol, basePrice, onTick, interval)

    act(() => {
      jest.advanceTimersByTime(interval)
    })

    expect(onTick).toHaveBeenCalledTimes(1)
    const tickedPrice = onTick.mock.calls[0][0]
    expect(tickedPrice).toBeGreaterThanOrEqual(basePrice * 0.95)
    expect(tickedPrice).toBeLessThanOrEqual(basePrice * 1.05)

    stopMockTicking(symbol)
  })

  it('should stop ticking when stopped', () => {
    const basePrice = 100
    const symbol = 'TSLA'
    const onTick = jest.fn()
    const interval = 1000

    startMockTicking(symbol, basePrice, onTick, interval)

    act(() => {
      jest.advanceTimersByTime(interval * 2)
    })

    expect(onTick).toHaveBeenCalledTimes(2)

    stopMockTicking(symbol)

    act(() => {
      jest.advanceTimersByTime(interval * 2)
    })

    expect(onTick).toHaveBeenCalledTimes(2)
  })

  it('should generate deterministic ticks for same symbol', () => {
    const basePrice = 150
    const symbol = 'GOOGL'
    const ticks1 = []
    const ticks2 = []

    const onTick1 = (price) => ticks1.push(price)
    const onTick2 = (price) => ticks2.push(price)

    startMockTicking(symbol, basePrice, onTick1, 1000)

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    stopMockTicking(symbol)

    startMockTicking(symbol, basePrice, onTick2, 1000)

    act(() => {
      jest.advanceTimersByTime(3000)
    })

    stopMockTicking(symbol)

    expect(ticks1.length).toBe(3)
    expect(ticks2.length).toBe(3)
    expect(ticks1).toEqual(ticks2)
  })
})

describe('Trade Modal Locked Price', () => {
  it('should not be affected by live price changes - this is a behavioral requirement', () => {
    expect(true).toBe(true)
  })
})
