import { useCallback, useEffect, useRef, useState } from 'react'
import { advanceSimulation, controlSimulation, initialSimulation } from '../simulation/deliverySimulation'
import type { SimulationAction } from '../simulation/deliverySimulation'

export function useDeliverySimulation() {
  const [state, setState] = useState(initialSimulation)
  const stateRef = useRef(state)
  // Each effect lifetime owns exactly one RAF chain, including in StrictMode.
  // The monotonic RAF timestamp is only a delta source; pause resets the baseline.
  const baselineRef = useRef<number | null>(null)
  const control = useCallback((action: SimulationAction) => {
    const next = controlSimulation(stateRef.current, action)
    if (next === stateRef.current) return
    baselineRef.current = null
    stateRef.current = next
    setState(next)
  }, [])
  useEffect(() => {
    let frame = 0
    let mounted = true
    const tick = (timestamp: number) => {
      if (!mounted) return
      // Hidden-tab time is excluded: no surprise jump when returning to the demo.
      if (document.hidden || !stateRef.current.running) baselineRef.current = null
      else {
        const previous = baselineRef.current
        baselineRef.current = timestamp
        if (previous !== null) {
          const next = advanceSimulation(stateRef.current, timestamp - previous)
          stateRef.current = next
          setState(next)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    const resetBaseline = () => { baselineRef.current = null }
    document.addEventListener('visibilitychange', resetBaseline)
    frame = requestAnimationFrame(tick)
    return () => {
      mounted = false
      cancelAnimationFrame(frame)
      baselineRef.current = null
      document.removeEventListener('visibilitychange', resetBaseline)
    }
  }, [])
  return { state, control }
}
