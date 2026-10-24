// New release artwork: an abstract north-facing delivery vehicle built from basic geometry.
// MapLibre retains control of position, heading and pitch.
export function scooterSymbol(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 44 64')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('delivery-scooter')
  svg.innerHTML = `<ellipse cx="22" cy="36" rx="17" ry="25" fill="#06121d" opacity=".45"/>
    <rect x="19" y="2" width="6" height="12" rx="2" fill="#c8e6ff"/>
    <rect x="19" y="51" width="6" height="11" rx="2" fill="#c8e6ff"/>
    <rect x="11" y="10" width="22" height="4" rx="2" fill="#d6edff"/>
    <rect x="15" y="15" width="14" height="35" rx="6" fill="#61a7ff" stroke="#e4f4ff" stroke-width="1.5"/>
    <rect x="18" y="19" width="8" height="12" rx="3" fill="#c9edff"/>
    <rect x="9" y="35" width="26" height="17" rx="3" fill="#45cfb4" stroke="#d9fff5" stroke-width="1.5"/>
    <rect x="20" y="36" width="4" height="15" fill="#c9fff1"/>
    <circle cx="22" cy="7" r="2" fill="#fff2b0"/>`
  return svg
}
