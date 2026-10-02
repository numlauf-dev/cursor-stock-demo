/**
 * Mock price tick generator for demo mode
 * Simulates realistic small price movements
 */

const activeTickGenerators = new Map()

/**
 * Generate a small realistic price change
 * Uses a deterministic pseudo-random walk based on symbol and time
 */
const generatePriceTick = (basePrice, symbol, iteration) => {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seed = hash + iteration
  
  const pseudoRandom = Math.abs(Math.sin(seed * 12.9898) * Math.cos(seed * 78.233)) % 1
  
  const maxChange = basePrice * 0.002
  const change = (pseudoRandom - 0.5) * 2 * maxChange
  
  const newPrice = basePrice + change
  return Math.max(newPrice, basePrice * 0.95)
}

/**
 * Start generating mock ticks for a symbol
 */
export const startMockTicking = (symbol, basePrice, onTick, interval = 15000) => {
  if (activeTickGenerators.has(symbol)) {
    return
  }

  let iteration = 0
  let currentPrice = basePrice

  const tick = () => {
    iteration++
    currentPrice = generatePriceTick(currentPrice, symbol, iteration)
    onTick(currentPrice)
  }

  const timerId = setInterval(tick, interval)
  activeTickGenerators.set(symbol, { timerId, currentPrice })

  return () => {
    clearInterval(timerId)
    activeTickGenerators.delete(symbol)
  }
}

/**
 * Stop generating mock ticks for a symbol
 */
export const stopMockTicking = (symbol) => {
  const generator = activeTickGenerators.get(symbol)
  if (generator) {
    clearInterval(generator.timerId)
    activeTickGenerators.delete(symbol)
  }
}

/**
 * Stop all mock tick generators
 */
export const stopAllMockTicking = () => {
  activeTickGenerators.forEach((generator) => {
    clearInterval(generator.timerId)
  })
  activeTickGenerators.clear()
}

/**
 * Check if demo ticking is enabled via env var
 */
export const isDemoTickingEnabled = () => {
  return import.meta.env.VITE_DEMO_TICKS !== 'false'
}
