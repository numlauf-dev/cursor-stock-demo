import { useEffect, useState, useRef } from 'react'
import { formatCurrency } from '../../utils/calculations'

/**
 * PriceWithFlash - Displays a price with a flash animation when it changes
 * 
 * @param {number} price - Current price
 * @param {string} className - Additional CSS classes
 * @param {boolean} respectMotionPreference - Whether to respect prefers-reduced-motion (default: true)
 */
const PriceWithFlash = ({ price, className = '', respectMotionPreference = true }) => {
  const [flash, setFlash] = useState(null)
  const prevPriceRef = useRef(price)
  const timerRef = useRef(null)
  const prefersReducedMotion = useRef(
    respectMotionPreference && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const prevPrice = prevPriceRef.current

    if (prevPrice !== null && prevPrice !== undefined && price !== prevPrice && price > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      const direction = price > prevPrice ? 'up' : 'down'
      setFlash(direction)

      timerRef.current = setTimeout(() => {
        setFlash(null)
      }, 800)
    }

    prevPriceRef.current = price

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [price])

  const flashClass = flash && !prefersReducedMotion.current
    ? flash === 'up'
      ? 'animate-flash-up'
      : 'animate-flash-down'
    : ''

  return (
    <span className={`${className} ${flashClass} transition-colors duration-800`}>
      {formatCurrency(price)}
    </span>
  )
}

export default PriceWithFlash
