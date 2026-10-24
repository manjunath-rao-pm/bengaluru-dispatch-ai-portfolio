import type { SimulationAction, SimulationState } from '../simulation/deliverySimulation'
import { delivery } from '../simulation/deliverySimulation'
import './SimulationPanel.css'

export default function SimulationPanel({ state, onControl }: {
  state: SimulationState
  onControl: (action: SimulationAction) => void
}) {
  const paused = !state.running && state.status !== 'Idle' && state.status !== 'Delivered'
  return <section className="simulation-panel" aria-labelledby="simulation-heading">
    <div className="simulation-heading"><div><h2 id="simulation-heading">One delivery, in motion</h2><p>Synthetic demonstration · {delivery.partner.name} · {delivery.customer.name}</p></div><span className="small-tag">SINGLE DELIVERY</span></div>
    <div className="simulation-summary"><div><span>Active order status</span><strong role="status">{state.status}{paused ? ' (paused)' : ''}</strong></div><div><span>Simulated elapsed time</span><strong><output>{(state.elapsedMs / 1000).toFixed(1)} s</output><small> / 30.0 s</small></strong></div></div>
    <p className="simulation-route">{delivery.partner.name} → {delivery.restaurant.name} → {delivery.customer.name} <span>Koramangala</span></p>
    <div className="simulation-controls">
      <button onClick={() => onControl('start')} disabled={state.status !== 'Idle'}>Start</button>
      <button onClick={() => onControl('pause')} disabled={!state.running}>Pause</button>
      <button onClick={() => onControl('resume')} disabled={!paused}>Resume</button>
      <button onClick={() => onControl('reset')}>Reset</button>
    </div>
    <p className="simulation-disclaimer">Cached OpenStreetMap road routes · Car-profile geometry, not motorcycle navigation. Compressed demo timing (not ETA): 12 s to pickup + 2 s pickup stop + 16 s to customer. Only the highlighted blue partner moves. Three selected demo locations are road-snapped; other markers remain static.</p>
    <div className="simulation-activity"><h3>Delivery activity</h3>{state.events.length === 0 ? <p>No events yet. Press Start to begin.</p> : <ol aria-live="polite" aria-relevant="additions">{state.events.map(event => <li key={event.id}><time>{(event.elapsedMs / 1000).toFixed(1)} s</time><span>{event.message}</span></li>)}</ol>}</div>
  </section>
}

