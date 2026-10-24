import { useState, type ReactNode } from 'react'
import './App.css'
import DispatchMap from './components/DispatchMap'
import SimulationPanel from './components/SimulationPanel'
import { useDeliverySimulation } from './hooks/useDeliverySimulation'
import './Cinematic.css'

type IconName = 'grid' | 'route' | 'chart' | 'spark' | 'box' | 'rider' | 'clock' | 'target' | 'pin'
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  // New release artwork: coordinate-grid compositions using only basic geometry.
  const artwork: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="4" width="6" height="15" rx="1" /><rect x="12" y="4" width="9" height="6" rx="1" /><rect x="12" y="13" width="9" height="6" rx="1" /></>,
    route: <><rect x="2" y="3" width="5" height="5" /><polyline points="7,5 17,5 17,17 10,17" /><rect x="5" y="15" width="5" height="5" /></>,
    chart: <><rect x="3" y="13" width="4" height="7" /><rect x="10" y="8" width="4" height="12" /><rect x="17" y="3" width="4" height="17" /></>,
    spark: <><rect x="9" y="9" width="6" height="6" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>,
    box: <><rect x="4" y="6" width="16" height="15" rx="2" /><rect x="9" y="6" width="6" height="5" /><line x1="7" y1="3" x2="17" y2="3" /></>,
    rider: <><circle cx="8" cy="7" r="3" /><rect x="3" y="13" width="10" height="8" rx="3" /><rect x="17" y="12" width="4" height="9" /><line x1="17" y1="7" x2="21" y2="7" /></>,
    clock: <><rect x="4" y="5" width="16" height="16" rx="4" /><polyline points="12,8 12,13 16,15" /><line x1="9" y1="2" x2="15" y2="2" /></>,
    target: <><rect x="3" y="3" width="18" height="18" rx="3" /><rect x="8" y="8" width="8" height="8" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    pin: <><rect x="5" y="3" width="14" height="13" rx="3" /><circle cx="12" cy="9" r="2" /><line x1="12" y1="16" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{artwork[name]}</svg>
}

const metrics: { label: string; value: string; unit?: string; icon: IconName; note: string; color: string }[] = [
  { label: 'Active Orders', value: '128', icon: 'box', note: 'Orders currently in progress', color: 'teal' },
  { label: 'Available Partners', value: '45', icon: 'rider', note: 'Ready for their next delivery', color: 'blue' },
  { label: 'Average Delivery ETA', value: '24', unit: 'minutes', icon: 'clock', note: 'From pickup to doorstep', color: 'amber' },
  { label: 'On-Time Delivery Rate', value: '94%', icon: 'target', note: 'Deliveries within the expected ETA', color: 'purple' },
]
const navigation: { label: string; icon: IconName; target: string }[] = [
  { label: 'Overview', icon: 'grid', target: 'overview' },
  { label: 'Demo Operations', icon: 'route', target: 'operations' },
  { label: 'Analytics', icon: 'chart', target: 'analytics' },
  { label: 'AI Insights', icon: 'spark', target: 'insights' },
]

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const simulation = useDeliverySimulation()
  return (
    <div className="app-shell">
      <a className="skip-link" href="#overview">Skip to dashboard</a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Bengaluru Dispatch AI home"><span className="brand-mark"><Icon name="route" size={25} /></span><span>Bengaluru<span className="brand-sub">DISPATCH AI</span></span></a>
        <div className="workspace"><span className="workspace-icon">B</span><span>Bengaluru workspace<small>Portfolio project</small></span></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Main navigation">{navigation.map(item => <a key={item.label} href={`#${item.target}`} className={activeNav === item.label ? 'nav-item active' : 'nav-item'} aria-current={activeNav === item.label ? 'location' : undefined} onClick={() => setActiveNav(item.label)}><Icon name={item.icon} />{item.label}{item.label === 'Demo Operations' && <span className="nav-dot" />}</a>)}</nav>
        <div className="sidebar-bottom"><div className="demo-note"><span className="demo-note-icon"><Icon name="spark" /></span><strong>A glimpse of what’s next.</strong><p>A smarter way to explore last-mile delivery operations.</p><span className="small-tag">DEMO ENVIRONMENT</span></div><div className="profile"><span className="avatar">BD</span><span>Dispatch workspace<small>Personal portfolio</small></span><span className="profile-dot" /></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="topbar-right"><span className="location"><Icon name="pin" size={15} /> Bengaluru, IN</span><span className="demo-badge"><span />DEMO / SYNTHETIC DATA</span><span className="avatar small">BD</span></div></header>
        <main id="overview">
          <div className="page-heading"><div><p className="eyebrow">CITY INTELLIGENCE / PHASE B1</p><h1>Bengaluru Dispatch AI<span className="title-dot">.</span></h1><p className="subtitle">A living perspective on last-mile delivery. Bengaluru, in motion.</p></div><span className="snapshot"><Icon name="clock" size={16} /> Demo snapshot</span></div>
          <div className="notice"><span className="notice-icon">i</span><p><strong>Built for demonstration.</strong> Delivery partners, restaurants, customers, events and KPI values are synthetic. Roads and basemap geography are real OpenStreetMap-derived data. No live operations or AI services are connected.</p><span className="notice-label">SYNTHETIC DATA</span></div>
          <div className="operations-stage">
          <section className="metrics" id="analytics" aria-label="Synthetic delivery metrics">{metrics.map(metric => <article className={`metric-card ${metric.color}`} key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className="metric-icon"><Icon name={metric.icon} /></span></div><p className="metric-value">{metric.value} {metric.unit && <span>{metric.unit}</span>}</p><div className="metric-bottom"><span className="metric-tick" />{metric.note}</div><p className="metric-demo-label">FIXED DEMO VALUE</p><div className="metric-accent" /></article>)}</section>
          <SimulationPanel state={simulation.state} onControl={simulation.control} />
          <section className="map-panel" id="operations" aria-labelledby="map-heading"><div className="panel-heading"><div><h2 id="map-heading">Bengaluru Dispatch Simulation</h2><p>Urban operations canvas · Koramangala, Bengaluru</p></div><span className="placeholder-tag"><span />35 synthetic locations</span></div>
            <DispatchMap simulation={simulation.state} />
            <div className="map-footer"><span><Icon name="pin" size={15} /> Bengaluru, Karnataka</span><span>Synthetic demonstration locations <span className="footer-arrow">→</span></span></div>
          </section>
          </div>
          <section className="insight-panel" id="insights"><span className="insight-icon"><Icon name="spark" size={23} /></span><div><div className="insight-title"><h2>A foundation for smarter dispatch</h2><span className="small-tag">ON THE ROADMAP</span></div><p>Route intelligence, delivery predictions, and operational insights — all start with a clear overview.</p><p className="insight-disclaimer">AI features are planned for a later phase. No AI analysis is running.</p></div><span className="insight-decoration" aria-hidden="true">✧</span></section>
          <footer className="page-footer"><span>Bengaluru Dispatch AI <span className="footer-divider">/</span> Built to learn. Designed to deliver.</span><span><span className="legend-dot" />Synthetic data · Portfolio demonstration</span></footer>
        </main>
      </div>
    </div>
  )
}
export default App






