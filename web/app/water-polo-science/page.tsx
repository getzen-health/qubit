import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Water Polo Science | KQuarks' }

export default function WaterPoloSciencePage() {
  const chartData = [
    { label: 'Upper Corner', value: 52, pct: 100, colorA: '#00b4d8', colorB: '#90e0ef' },
    { label: 'Power Play', value: 43, pct: 83, colorA: '#90e0ef', colorB: '#00b4d8' },
    { label: 'Centre (6v5)', value: 38, pct: 73, colorA: '#00b4d8', colorB: '#90e0ef' },
    { label: 'Long Range', value: 22, pct: 42, colorA: '#90e0ef', colorB: '#00b4d8' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --wp-ocean: #0a2540;
          --wp-aqua: #00b4d8;
          --wp-surf: #90e0ef;
          --wp-dark: #060f1a;
          --wp-text: #e8f4f8;
          --wp-surface: #0b1e30;
          --wp-surface-2: #102538;
          --wp-border: #163347;
          --wp-border-mid: #1e4a66;
          --wp-aqua-glow: rgba(0, 180, 216, 0.12);
          --wp-aqua-glow-lg: rgba(0, 180, 216, 0.06);
          --wp-surf-glow: rgba(144, 224, 239, 0.10);
          --wp-surf-glow-lg: rgba(144, 224, 239, 0.05);
          --wp-text-dim: #6ba3be;
          --wp-text-faint: #153047;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wp-root {
          min-height: 100vh;
          background-color: var(--wp-dark);
          color: var(--wp-text);
          font-family: 'Exo 2', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .wp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Deep ocean radial glow */
        .wp-root::after {
          content: '';
          position: fixed;
          top: -30vh;
          left: 50%;
          transform: translateX(-50%);
          width: 200vw;
          height: 70vh;
          background: radial-gradient(ellipse at top, rgba(0, 180, 216, 0.05) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .wp-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(6, 15, 26, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--wp-border);
        }

        .wp-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .wp-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--wp-surface);
          border: 1px solid var(--wp-border);
          color: var(--wp-text-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .wp-back-btn:hover {
          background: var(--wp-surface-2);
          border-color: var(--wp-aqua);
          color: var(--wp-aqua);
        }

        .wp-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--wp-aqua);
          opacity: 0.7;
        }

        .wp-header-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 18px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.06em;
          color: var(--wp-text);
          text-transform: uppercase;
        }

        /* Main */
        .wp-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .wp-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: wp-fade-up 0.6s ease both;
        }

        @keyframes wp-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes wp-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes wp-bar-grow {
          from { width: 0; }
        }

        @keyframes wp-wave-flow {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Ripple stripes in hero bg */
        .wp-hero-stripes {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .wp-hero-stripe {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: var(--wp-aqua);
          opacity: 0.03;
          transform: skewX(-12deg);
        }

        .wp-hero-stripe:nth-child(1) { left: 8%; }
        .wp-hero-stripe:nth-child(2) { left: 22%; }
        .wp-hero-stripe:nth-child(3) { left: 38%; }
        .wp-hero-stripe:nth-child(4) { left: 54%; }
        .wp-hero-stripe:nth-child(5) { left: 70%; }
        .wp-hero-stripe:nth-child(6) { left: 86%; }

        /* Glow blob */
        .wp-hero-glow {
          position: absolute;
          top: -80px;
          right: -60px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, rgba(144, 224, 239, 0.04) 50%, transparent 70%);
          pointer-events: none;
          animation: wp-glow-pulse 5s ease-in-out infinite;
        }

        .wp-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--wp-aqua);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wp-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--wp-aqua));
        }

        .wp-hero-h1 {
          font-family: 'Exo 2', sans-serif;
          font-size: clamp(56px, 10vw, 116px);
          line-height: 0.88;
          letter-spacing: -0.01em;
          font-weight: 900;
          font-style: italic;
          text-transform: uppercase;
          color: var(--wp-text);
          margin-bottom: 10px;
        }

        .wp-hero-h1 .accent-aqua {
          color: var(--wp-aqua);
          display: block;
          text-shadow: 0 0 60px rgba(0, 180, 216, 0.35);
        }

        .wp-hero-h1 .accent-outline {
          -webkit-text-stroke: 1px var(--wp-surf);
          color: transparent;
          display: block;
        }

        .wp-hero-sub {
          font-family: 'Exo 2', sans-serif;
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--wp-text-dim);
          margin-top: 22px;
          max-width: 620px;
          line-height: 1.35;
        }

        /* Wave viz */
        .wp-wave-viz {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 32px;
          margin: 20px 0;
        }

        .wp-wave-bar {
          flex: 1;
          border-radius: 1px 1px 0 0;
          animation: wp-glow-pulse 2.2s ease-in-out infinite;
        }

        .wp-wave-bar:nth-child(odd) {
          background: linear-gradient(to top, var(--wp-aqua), rgba(0,180,216,0.3));
          opacity: 0.4;
        }
        .wp-wave-bar:nth-child(even) {
          background: linear-gradient(to top, var(--wp-surf), rgba(144,224,239,0.3));
          opacity: 0.3;
        }
        .wp-wave-bar:nth-child(3n) { animation-delay: 0.2s; opacity: 0.7; }
        .wp-wave-bar:nth-child(5n) { animation-delay: 0.4s; opacity: 0.6; }
        .wp-wave-bar:nth-child(7n) { animation-delay: 0.1s; opacity: 0.9; }

        /* Key stats grid */
        .wp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: wp-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .wp-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .wp-stat-tile {
          background: var(--wp-surface);
          border: 1px solid var(--wp-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .wp-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .wp-stat-tile.c1::before { background: var(--wp-aqua); }
        .wp-stat-tile.c2::before { background: var(--wp-surf); }
        .wp-stat-tile.c3::before { background: var(--wp-aqua); }
        .wp-stat-tile.c4::before { background: var(--wp-surf); }

        .wp-stat-tile:hover {
          border-color: var(--wp-border-mid);
        }

        .wp-stat-num {
          font-family: 'Exo 2', sans-serif;
          font-size: 36px;
          font-weight: 900;
          font-style: italic;
          line-height: 1;
        }

        .wp-stat-tile.c1 .wp-stat-num { color: var(--wp-aqua); }
        .wp-stat-tile.c2 .wp-stat-num { color: var(--wp-surf); }
        .wp-stat-tile.c3 .wp-stat-num { color: var(--wp-aqua); }
        .wp-stat-tile.c4 .wp-stat-num { color: var(--wp-surf); }

        .wp-stat-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--wp-text-dim);
          margin-top: 2px;
        }

        .wp-stat-label {
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--wp-text-dim);
          margin-top: 8px;
        }

        .wp-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--wp-text-faint);
          margin-top: 4px;
          letter-spacing: 0.04em;
        }

        /* Section label */
        .wp-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--wp-text-dim);
          margin: 48px 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wp-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--wp-border);
        }

        /* Chart section */
        .wp-chart-wrap {
          background: var(--wp-surface);
          border: 1px solid var(--wp-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: wp-fade-up 0.5s ease 0.15s both;
          position: relative;
          overflow: hidden;
        }

        .wp-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--wp-aqua), var(--wp-surf));
        }

        .wp-chart-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 22px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--wp-text);
          margin-bottom: 6px;
        }

        .wp-chart-sub {
          font-family: 'Exo 2', sans-serif;
          font-size: 14px;
          color: var(--wp-text-dim);
          margin-bottom: 28px;
        }

        .wp-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wp-chart-row {
          display: grid;
          grid-template-columns: 160px 1fr 72px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .wp-chart-row {
            grid-template-columns: 120px 1fr 52px;
            gap: 8px;
          }
        }

        .wp-chart-label {
          font-family: 'Exo 2', sans-serif;
          font-size: 14px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--wp-text-dim);
          text-align: right;
        }

        .wp-chart-track {
          height: 32px;
          background: var(--wp-surface-2);
          border: 1px solid var(--wp-border);
          position: relative;
          overflow: hidden;
        }

        .wp-chart-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: wp-bar-grow 1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .wp-chart-inner-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
        }

        .wp-chart-pct {
          font-family: 'Exo 2', sans-serif;
          font-size: 16px;
          font-weight: 800;
          font-style: italic;
          color: var(--wp-text);
          text-align: right;
        }

        /* Science cards grid */
        .wp-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .wp-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .wp-card {
          background: var(--wp-surface);
          border: 1px solid var(--wp-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: wp-fade-up 0.5s ease both;
        }

        .wp-card:nth-child(1) { animation-delay: 0.0s; }
        .wp-card:nth-child(2) { animation-delay: 0.07s; }
        .wp-card:nth-child(3) { animation-delay: 0.14s; }
        .wp-card:nth-child(4) { animation-delay: 0.21s; }

        .wp-card:hover { border-color: var(--wp-border-mid); }

        .wp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .wp-card.aqua::before { background: var(--wp-aqua); }
        .wp-card.surf::before { background: var(--wp-surf); }
        .wp-card.aqua-surf::before { background: linear-gradient(90deg, var(--wp-aqua), var(--wp-surf)); }
        .wp-card.surf-aqua::before { background: linear-gradient(90deg, var(--wp-surf), var(--wp-aqua)); }

        .wp-card.aqua:hover { box-shadow: inset 0 0 80px var(--wp-aqua-glow-lg); }
        .wp-card.surf:hover { box-shadow: inset 0 0 80px var(--wp-surf-glow-lg); }
        .wp-card.aqua-surf:hover { box-shadow: inset 0 0 80px var(--wp-aqua-glow-lg); }
        .wp-card.surf-aqua:hover { box-shadow: inset 0 0 80px var(--wp-surf-glow-lg); }

        .wp-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .wp-card.aqua .wp-card-glow-orb { background: var(--wp-aqua-glow); }
        .wp-card.surf .wp-card-glow-orb { background: var(--wp-surf-glow); }
        .wp-card.aqua-surf .wp-card-glow-orb { background: var(--wp-aqua-glow); }
        .wp-card.surf-aqua .wp-card-glow-orb { background: var(--wp-surf-glow); }

        .wp-card-num {
          font-family: 'Exo 2', sans-serif;
          font-size: 80px;
          font-weight: 900;
          font-style: italic;
          line-height: 1;
          position: absolute;
          top: 20px; right: 24px;
          opacity: 0.05;
          letter-spacing: -0.04em;
          pointer-events: none;
        }

        .wp-card.aqua .wp-card-num { color: var(--wp-aqua); }
        .wp-card.surf .wp-card-num { color: var(--wp-surf); }
        .wp-card.aqua-surf .wp-card-num { color: var(--wp-aqua); }
        .wp-card.surf-aqua .wp-card-num { color: var(--wp-surf); }

        .wp-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .wp-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .wp-card.aqua .wp-card-icon { background: var(--wp-aqua-glow); }
        .wp-card.surf .wp-card-icon { background: var(--wp-surf-glow); }
        .wp-card.aqua-surf .wp-card-icon { background: var(--wp-aqua-glow); }
        .wp-card.surf-aqua .wp-card-icon { background: var(--wp-surf-glow); }

        .wp-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .wp-card.aqua .wp-card-kicker { color: var(--wp-aqua); }
        .wp-card.surf .wp-card-kicker { color: var(--wp-surf); }
        .wp-card.aqua-surf .wp-card-kicker { color: var(--wp-aqua); }
        .wp-card.surf-aqua .wp-card-kicker { color: var(--wp-surf); }

        .wp-card-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 26px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--wp-text);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .wp-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .wp-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.016);
          border-left: 2px solid var(--wp-border);
          transition: all 0.15s ease;
        }

        .wp-finding:hover {
          background: rgba(255,255,255,0.030);
        }

        .wp-card.aqua .wp-finding:hover { border-left-color: rgba(0,180,216,0.5); }
        .wp-card.surf .wp-finding:hover { border-left-color: rgba(144,224,239,0.5); }
        .wp-card.aqua-surf .wp-finding:hover { border-left-color: rgba(0,180,216,0.5); }
        .wp-card.surf-aqua .wp-finding:hover { border-left-color: rgba(144,224,239,0.5); }

        .wp-finding-stat {
          flex-shrink: 0;
          min-width: 84px;
        }

        .wp-finding-stat-val {
          font-family: 'Exo 2', sans-serif;
          font-size: 19px;
          font-weight: 800;
          font-style: italic;
          line-height: 1;
          white-space: nowrap;
        }

        .wp-card.aqua .wp-finding-stat-val { color: var(--wp-aqua); }
        .wp-card.surf .wp-finding-stat-val { color: var(--wp-surf); }
        .wp-card.aqua-surf .wp-finding-stat-val { color: var(--wp-aqua); }
        .wp-card.surf-aqua .wp-finding-stat-val { color: var(--wp-surf); }

        .wp-finding-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--wp-text-dim);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .wp-finding-body { flex: 1; }

        .wp-finding-title {
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--wp-text);
          margin-bottom: 3px;
        }

        .wp-finding-desc {
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--wp-text-dim);
          line-height: 1.45;
        }

        /* Disclaimer */
        .wp-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--wp-surface);
          border: 1px solid var(--wp-border);
          border-left: 3px solid var(--wp-border-mid);
        }

        .wp-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--wp-text-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .wp-hero { padding: 56px 0 48px; }
          .wp-card { padding: 24px 18px; }
          .wp-chart-wrap { padding: 24px 18px; }
          .wp-hero-h1 { font-size: 54px; }
          .wp-chart-label { font-size: 11px; }
        }
      `}} />

      <div className="wp-root">
        {/* Header */}
        <header className="wp-header">
          <div className="wp-header-inner">
            <Link href="/workouts" className="wp-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="wp-header-label">Sports Science Series</div>
              <div className="wp-header-title">Water Polo Science</div>
            </div>
          </div>
        </header>

        <main className="wp-main">
          {/* Hero */}
          <section className="wp-hero">
            <div className="wp-hero-stripes" aria-hidden="true">
              <div className="wp-hero-stripe" />
              <div className="wp-hero-stripe" />
              <div className="wp-hero-stripe" />
              <div className="wp-hero-stripe" />
              <div className="wp-hero-stripe" />
              <div className="wp-hero-stripe" />
            </div>
            <div className="wp-hero-glow" aria-hidden="true" />

            <div className="wp-hero-tag">Aquatic Combat Team Sport</div>

            <h1 className="wp-hero-h1">
              <span>WATER POLO</span>
              <span className="accent-aqua">POWER</span>
              <span className="accent-outline">&amp; SCIENCE</span>
            </h1>

            <p className="wp-hero-sub">
              Eggbeater biomechanics, aerial throwing mechanics, and the aquatic physiology behind elite competition. Evidence-based performance research from pool to podium.
            </p>

            <div className="wp-wave-viz" aria-hidden="true">
              {[3,7,2,9,4,6,2,8,3,10,2,5,4,8,2,7,3,9,2,6,4,8,3,5].map((h, i) => (
                <div key={i} className="wp-wave-bar" style={{height: `${h * 10}%`}} />
              ))}
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="wp-section-title">Key Statistics</div>
          <div className="wp-stats-grid">
            <div className="wp-stat-tile c1">
              <div className="wp-stat-num">1.5–3 km</div>
              <div className="wp-stat-unit">per match</div>
              <div className="wp-stat-label">Per Match Distance</div>
              <div className="wp-stat-ref">Smith 2004</div>
            </div>
            <div className="wp-stat-tile c2">
              <div className="wp-stat-num">60–80</div>
              <div className="wp-stat-unit">km/h</div>
              <div className="wp-stat-label">Throw Speed</div>
              <div className="wp-stat-ref">Van den Tillaar 2014</div>
            </div>
            <div className="wp-stat-tile c3">
              <div className="wp-stat-num">43%</div>
              <div className="wp-stat-unit">conversion</div>
              <div className="wp-stat-label">Power Play Conversion</div>
              <div className="wp-stat-ref">Argudo 2007</div>
            </div>
            <div className="wp-stat-tile c4">
              <div className="wp-stat-num">85–95%</div>
              <div className="wp-stat-unit">of HRmax</div>
              <div className="wp-stat-label">HRmax During Sprint</div>
              <div className="wp-stat-ref">Platanou 2005</div>
            </div>
          </div>

          {/* Chart */}
          <div className="wp-section-title">Shooting Conversion Rates</div>
          <div className="wp-chart-wrap">
            <div className="wp-chart-title">Shooting Conversion Rates by Zone</div>
            <div className="wp-chart-sub">Elite water polo — shot conversion percentage by shooting zone and situation</div>
            <div className="wp-chart-rows">
              {chartData.map((row, i) => (
                <div className="wp-chart-row" key={i}>
                  <div className="wp-chart-label">{row.label}</div>
                  <div className="wp-chart-track">
                    <div
                      className="wp-chart-bar"
                      style={{
                        width: `${row.pct}%`,
                        background: `linear-gradient(90deg, ${row.colorA}33, ${row.colorB}cc)`
                      }}
                    >
                      <span className="wp-chart-inner-val" style={{color: row.colorA}}>{row.value}%</span>
                    </div>
                  </div>
                  <div className="wp-chart-pct" style={{color: row.colorA}}>{row.value}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="wp-section-title">Research Findings</div>
          <div className="wp-cards-grid">

            {/* Card 1: Swimming Demands */}
            <div className="wp-card aqua">
              <div className="wp-card-glow-orb" />
              <div className="wp-card-num">01</div>
              <div className="wp-card-top-row">
                <div className="wp-card-icon">🏊</div>
                <div className="wp-card-kicker">Swimming Demands</div>
              </div>
              <div className="wp-card-title">Swimming Demands &amp; Physical Profile</div>
              <div className="wp-card-findings">
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">1.5–3 km</div>
                    <div className="wp-finding-ref">Smith 2004</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Elite Match Swimming Distance</div>
                    <div className="wp-finding-desc">Motion analysis in elite water polo: field players cover 1.5–3.0 km per match depending on position. Attackers accumulate greater sprint volumes; defenders more sustained moderate-intensity swimming. Hole set players experience highest strength-contact demand per unit distance. Goalkeepers perform 50–80 explosive lateral movements per match rather than distance swimming.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">40–60%</div>
                    <div className="wp-finding-ref">Sanders 1999</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Eggbeater Kick — Match Time</div>
                    <div className="wp-finding-desc">The eggbeater kick occupies 40–60% of total match time in elite water polo. Alternating hip abduction/adduction cycles (60–90 cycles/min at full intensity) generate vertical propulsion to elevate the body 10–25 cm for throwing. Energy cost of eggbeater treading water: approximately 60–80% of VO₂max — significantly higher than freestyle swimming at the same heart rate. Hip abductor and adductor strength are key determinants of vertical elevation and sustained performance.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">58–68 mL/kg/min</div>
                    <div className="wp-finding-ref">Platanou 2005</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Aerobic Capacity — Elite VO₂max</div>
                    <div className="wp-finding-desc">Elite water polo players demonstrate VO₂max of 58–68 mL/kg/min, with heart rate reaching 85–95% HRmax during sprint phases. The sport&apos;s aerobic-anaerobic mix — continuous swimming base punctuated by 2–5 second explosive sprints — demands both high aerobic capacity and rapid PCr replenishment. Blood lactate during competition: 6–10 mmol/L across four 8-minute quarters.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">10–14% BF</div>
                    <div className="wp-finding-ref">Konstantaki 1998</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Optimal Body Composition</div>
                    <div className="wp-finding-desc">Optimal body fat for elite water polo players is 10–14%, balancing buoyancy advantage (higher fat aids flotation, reducing eggbeater energy cost) with lean mass requirements for throwing power and sprint velocity. Elite players carry 5–8 kg more upper body lean mass than competitive swimmers, reflecting the sport&apos;s throwing and contact demands.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Throwing Biomechanics */}
            <div className="wp-card surf">
              <div className="wp-card-glow-orb" />
              <div className="wp-card-num">02</div>
              <div className="wp-card-top-row">
                <div className="wp-card-icon">⚡</div>
                <div className="wp-card-kicker">Biomechanics</div>
              </div>
              <div className="wp-card-title">Throwing Biomechanics &amp; Shooting</div>
              <div className="wp-card-findings">
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">60–80 km/h</div>
                    <div className="wp-finding-ref">Van den Tillaar 2014</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Throwing Velocity from Water</div>
                    <div className="wp-finding-desc">Water polo throwing from water achieves 60–80 km/h — 12–18% lower than equivalent land-based throwing due to absence of ground reaction force. The kinetic chain: eggbeater elevation → trunk rotation (contributing ~55% of total ball velocity) → shoulder internal rotation (2,800–3,800°/s) → elbow extension → wrist snap. Elite players achieve jump-throw velocities within 8% of their standing land throws.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">10–25 cm</div>
                    <div className="wp-finding-ref">Platanou 2009</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Jump Throw — Aerial Height</div>
                    <div className="wp-finding-desc">The jump throw elevates the player 10–25 cm above water via explosive eggbeater transition (0.3–0.6 s). During the aerial phase (0.4–0.7 s), the shooting arm loads into external rotation while the opposite arm stabilises. Without a stable ground base, trunk angular momentum is generated entirely from the aquatic propulsion phase — a unique biomechanical constraint distinguishing water polo from all land throwing sports.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">35–55%</div>
                    <div className="wp-finding-ref">Lupo 2012</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Shooting Conversion by Zone</div>
                    <div className="wp-finding-desc">World Championships analysis: overall shot conversion rates range 35–55% depending on zone and defensive pressure. Upper corner placement: 48–55% (highest scoring zone). Lower corner: 30–38%. Penalty (5m): 72–82% — reflecting reduced goalkeeper reaction time. 62% of successful goals scored from within 4m of goal; long-range shots (&gt;6m) convert at 18–25% and are used primarily for tactical deception.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">40–60%</div>
                    <div className="wp-finding-ref">Mountjoy 2010</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Shoulder Injury Prevalence</div>
                    <div className="wp-finding-desc">FINA injury surveillance: shoulder injuries account for 40–60% of all elite water polo injuries. Overhead throwing volume: 200–400 throws per session. GIRD of 15–22° in dominant arm prevalent in 65–75% of elite players. Prevention protocol: shoulder ER/IR ratio testing (target &gt;0.75), posterior capsule stretching, and progressive throwing load monitoring reduces injury incidence 30–40%.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Tactical & Positional */}
            <div className="wp-card aqua-surf">
              <div className="wp-card-glow-orb" />
              <div className="wp-card-num">03</div>
              <div className="wp-card-top-row">
                <div className="wp-card-icon">📊</div>
                <div className="wp-card-kicker">Tactical Science</div>
              </div>
              <div className="wp-card-title">Tactical &amp; Positional Science</div>
              <div className="wp-card-findings">
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">35–45%</div>
                    <div className="wp-finding-ref">Argudo 2007</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Power Play (6v5) Conversion</div>
                    <div className="wp-finding-desc">FINA analysis: man-up power plays (6v5) convert at 35–45% in elite competition — significantly higher than even-strength attacks (22–30%). The goalkeeper faces an extra attacker and must cover additional shooting lanes, reducing save probability by 18–25%. Rapid ball rotation (4–6 passes in 10–15 s) forces goalkeeper lateral movement. Cross-cage passing speed: 8–12 m/s.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">50–80</div>
                    <div className="wp-finding-ref">Platanou 2004</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Goalkeeper Saves Attempted</div>
                    <div className="wp-finding-desc">Elite water polo goalkeepers face 50–80 shot attempts per match, saving 45–65%. Ball-in-flight time from 5m penalty: approximately 220–300 ms at 60–70 km/h — at the limit of simple reaction time (180–200 ms). Goalkeepers must anticipate from pre-release cues. Elite goalkeepers achieve full-extension save reach of 2.0–2.6 m per side. Vertical jump height for upper corner saves: 40–55 cm from water.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">2–5 s sprints</div>
                    <div className="wp-finding-ref">Polo 2011</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Anaerobic Sprint Profile</div>
                    <div className="wp-finding-desc">Time-motion analysis: water polo match play includes 18–28 sprints per player per match, each lasting 2–5 seconds at 95–100% maximal swimming effort. Sprint-to-recovery ratios: approximately 1:6 to 1:10. PCr recovery in water is slightly slower than land due to sustained partial-intensity effort during recovery intervals — full PCr restoration requires 5–8 minutes of low-intensity movement.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">3–6 fouls/match</div>
                    <div className="wp-finding-ref">Lupo 2014</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Hole Set — Highest Contact Position</div>
                    <div className="wp-finding-desc">The hole set (2m player) experiences the highest physical contact forces in water polo, with estimated 80–150 N of continuous defensive resistance. Foul rate: 3–6 exclusion fouls drawn per match vs. 0.8–1.5 for perimeter players. Strength requirements: hole set players have the highest bench press (120–140 kg 1RM) and lat pulldown strength of any position, enabling them to hold position against defensive pressure.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Energy Systems */}
            <div className="wp-card surf-aqua">
              <div className="wp-card-glow-orb" />
              <div className="wp-card-num">04</div>
              <div className="wp-card-top-row">
                <div className="wp-card-icon">❤️</div>
                <div className="wp-card-kicker">Energy Systems</div>
              </div>
              <div className="wp-card-title">Energy Systems &amp; Conditioning</div>
              <div className="wp-card-findings">
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">6–10 mmol/L</div>
                    <div className="wp-finding-ref">Platanou 2005</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Blood Lactate During Match Play</div>
                    <div className="wp-finding-desc">Blood lactate during elite water polo competition averages 6–10 mmol/L, confirming substantial glycolytic contribution layered on a high aerobic base. Quarter-by-quarter intensity escalates: first quarter 5.8 mmol/L average, fourth quarter 9.2 mmol/L. Zone 2 swimming (65–75% HRmax) comprises 40–50% of total elite training volume, providing mitochondrial and lactate clearance adaptations for sustained competition performance.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">1–2 L/hour</div>
                    <div className="wp-finding-ref">Maughan 2010</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Dehydration Despite Water Immersion</div>
                    <div className="wp-finding-desc">Water polo players lose 1.0–2.0 litres of sweat per hour during competition, despite full aqueous immersion. Sweat rate is driven by core temperature — vigorous swimming raises core temperature 1.5–2.5°C — and is unrelated to the aquatic environment. At 2% body mass dehydration, cognitive performance (decision-making accuracy, reaction time) decreases 5–8%. Pre-match hyperhydration (500 mL 2 hours before) and electrolyte replacement at breaks is standard elite practice.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">15–20 pull-ups</div>
                    <div className="wp-finding-ref">Stirn 2011</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Strength Training — Pull Movement Priority</div>
                    <div className="wp-finding-desc">Water polo conditioning programmes emphasise upper body pull movements — lat pulldown, pull-up (target: 15–20 BW reps for elite players), seated cable row. Throwing-specific resistance work: medicine ball rotational throws (3–5 kg, 3×15), cable shoulder IR at simulated throwing angles. Shoulder ER strengthening targets ER/IR ratio &gt;0.75. Lower body: eggbeater-specific hip abductor/adductor strengthening, squat and power clean for jump throw height.</div>
                  </div>
                </div>
                <div className="wp-finding">
                  <div className="wp-finding-stat">
                    <div className="wp-finding-stat-val">12–24 hrs</div>
                    <div className="wp-finding-ref">Mountjoy 2010</div>
                  </div>
                  <div className="wp-finding-body">
                    <div className="wp-finding-title">Recovery Between Matches</div>
                    <div className="wp-finding-desc">Elite water polo tournaments schedule 2–3 matches per day at World Championships and Olympics. Throwing velocity declines 8–15% from first to third match in a day; sprint velocity declines 6–10%. Acute recovery: cold water immersion (14–16°C, 10–12 min post-match) reduces shoulder inflammation markers 20–30%. 12–24 hours is the evidence-based minimum for full metabolic recovery between high-intensity matches.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="wp-disclaimer">
            <div className="wp-disclaimer-text">
              DISCLAIMER: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies including FINA. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing players. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
