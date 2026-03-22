import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Badminton Science' }

export default function BadmintonSciencePage() {
  const chartData = [
    { label: 'Badminton smash', value: 493, pct: 100, color: '#00d4f5' },
    { label: 'Badminton pro avg', value: 380, pct: 77, color: '#0ab4c8' },
    { label: 'Tennis serve', value: 263, pct: 53, color: '#4b6cb7' },
    { label: 'Squash serve', value: 242, pct: 49, color: '#1a6bbd' },
    { label: 'Table tennis kill', value: 112, pct: 23, color: '#7c3aed' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --bm-black: #090c10;
          --bm-dark: #0d1117;
          --bm-surface: #111620;
          --bm-surface-2: #161c28;
          --bm-border: #1e2636;
          --bm-border-mid: #253040;
          --cyan: #00d4f5;
          --cyan-dim: #008fb0;
          --cyan-glow: rgba(0, 212, 245, 0.12);
          --cyan-glow-lg: rgba(0, 212, 245, 0.06);
          --blue: #0077b6;
          --blue-bright: #0096d6;
          --blue-glow: rgba(0, 119, 182, 0.14);
          --orange: #f4722b;
          --orange-dim: #a0451a;
          --orange-glow: rgba(244, 114, 43, 0.12);
          --teal: #06d6a0;
          --teal-dim: #048f6a;
          --teal-glow: rgba(6, 214, 160, 0.12);
          --chalk: #dde8f0;
          --chalk-dim: #7a90a8;
          --chalk-faint: #253040;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .bm-root {
          min-height: 100vh;
          background-color: var(--bm-black);
          color: var(--chalk);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .bm-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Court light beams */
        .bm-root::after {
          content: '';
          position: fixed;
          top: -40vh;
          left: 50%;
          transform: translateX(-50%);
          width: 200vw;
          height: 70vh;
          background: radial-gradient(ellipse at top, rgba(0, 212, 245, 0.04) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .bm-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(9, 12, 16, 0.93);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--bm-border);
        }

        .bm-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .bm-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--bm-surface);
          border: 1px solid var(--bm-border);
          color: var(--chalk-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .bm-back-btn:hover {
          background: var(--bm-surface-2);
          border-color: var(--cyan-dim);
          color: var(--cyan);
        }

        .bm-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--cyan-dim);
        }

        .bm-header-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--chalk);
          text-transform: uppercase;
        }

        /* Main */
        .bm-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .bm-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: bm-fade-up 0.6s ease both;
        }

        @keyframes bm-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bm-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes bm-draw {
          from { stroke-dashoffset: 900; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes bm-bar-grow {
          from { width: 0; }
        }

        /* Court lines in hero bg */
        .bm-hero-court {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .bm-hero-court-line {
          position: absolute;
          background: var(--cyan);
          opacity: 0.05;
        }

        .bm-hero-court-line.h { height: 1px; left: 0; right: 0; }
        .bm-hero-court-line.v { width: 1px; top: 0; bottom: 0; }
        .bm-hero-court-line.t10 { top: 10%; }
        .bm-hero-court-line.t60 { top: 60%; }
        .bm-hero-court-line.l33 { left: 33.3%; }
        .bm-hero-court-line.l66 { left: 66.6%; }

        /* Glow blob */
        .bm-hero-glow {
          position: absolute;
          top: -60px;
          right: -80px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 212, 245, 0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: bm-glow-pulse 4s ease-in-out infinite;
        }

        .bm-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cyan);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bm-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--cyan));
        }

        .bm-hero-h1 {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(56px, 10vw, 116px);
          line-height: 0.88;
          letter-spacing: -0.01em;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 10px;
        }

        .bm-hero-h1 .accent-cyan {
          color: var(--cyan);
          display: block;
          text-shadow: 0 0 60px rgba(0, 212, 245, 0.3);
        }

        .bm-hero-h1 .accent-outline {
          -webkit-text-stroke: 1px var(--blue-bright);
          color: transparent;
          display: block;
        }

        .bm-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 22px;
          max-width: 620px;
          line-height: 1.35;
        }

        /* Key stats grid */
        .bm-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: bm-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .bm-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .bm-stat-tile {
          background: var(--bm-surface);
          border: 1px solid var(--bm-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .bm-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .bm-stat-tile.c1::before { background: var(--cyan); }
        .bm-stat-tile.c2::before { background: var(--blue-bright); }
        .bm-stat-tile.c3::before { background: var(--orange); }
        .bm-stat-tile.c4::before { background: var(--teal); }

        .bm-stat-tile:hover {
          border-color: var(--bm-border-mid);
        }

        .bm-stat-num {
          font-family: 'Rajdhani', sans-serif;
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
          color: var(--chalk);
        }

        .bm-stat-tile.c1 .bm-stat-num { color: var(--cyan); }
        .bm-stat-tile.c2 .bm-stat-num { color: var(--blue-bright); }
        .bm-stat-tile.c3 .bm-stat-num { color: var(--orange); }
        .bm-stat-tile.c4 .bm-stat-num { color: var(--teal); }

        .bm-stat-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--chalk-dim);
          margin-top: 2px;
        }

        .bm-stat-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 8px;
        }

        .bm-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-faint);
          margin-top: 4px;
          letter-spacing: 0.04em;
        }

        /* Section label */
        .bm-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin: 48px 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bm-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--bm-border);
        }

        /* Chart section */
        .bm-chart-wrap {
          background: var(--bm-surface);
          border: 1px solid var(--bm-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: bm-fade-up 0.5s ease 0.15s both;
        }

        .bm-chart-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 6px;
        }

        .bm-chart-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          color: var(--chalk-dim);
          margin-bottom: 28px;
        }

        .bm-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .bm-chart-row {
          display: grid;
          grid-template-columns: 180px 1fr 64px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .bm-chart-row {
            grid-template-columns: 130px 1fr 48px;
            gap: 8px;
          }
        }

        .bm-chart-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          text-align: right;
        }

        .bm-chart-track {
          height: 28px;
          background: var(--bm-surface-2);
          border: 1px solid var(--bm-border);
          position: relative;
          overflow: hidden;
        }

        .bm-chart-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: bm-bar-grow 1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .bm-chart-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
        }

        .bm-chart-kmh {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--chalk);
          text-align: right;
        }

        /* Science cards grid */
        .bm-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .bm-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .bm-card {
          background: var(--bm-surface);
          border: 1px solid var(--bm-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: bm-fade-up 0.5s ease both;
        }

        .bm-card:nth-child(1) { animation-delay: 0.0s; }
        .bm-card:nth-child(2) { animation-delay: 0.07s; }
        .bm-card:nth-child(3) { animation-delay: 0.14s; }
        .bm-card:nth-child(4) { animation-delay: 0.21s; }

        .bm-card:hover { border-color: var(--bm-border-mid); }

        .bm-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .bm-card.cyan::before { background: var(--cyan); }
        .bm-card.blue::before { background: var(--blue-bright); }
        .bm-card.orange::before { background: var(--orange); }
        .bm-card.teal::before { background: var(--teal); }

        .bm-card.cyan:hover { box-shadow: inset 0 0 80px var(--cyan-glow-lg); }
        .bm-card.blue:hover { box-shadow: inset 0 0 80px var(--blue-glow); }
        .bm-card.orange:hover { box-shadow: inset 0 0 80px var(--orange-glow); }
        .bm-card.teal:hover { box-shadow: inset 0 0 80px var(--teal-glow); }

        .bm-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .bm-card.cyan .bm-card-glow-orb { background: var(--cyan-glow); }
        .bm-card.blue .bm-card-glow-orb { background: var(--blue-glow); }
        .bm-card.orange .bm-card-glow-orb { background: var(--orange-glow); }
        .bm-card.teal .bm-card-glow-orb { background: var(--teal-glow); }

        .bm-card-num {
          font-family: 'Rajdhani', sans-serif;
          font-size: 80px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 20px; right: 24px;
          opacity: 0.055;
          letter-spacing: -0.04em;
          pointer-events: none;
        }

        .bm-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .bm-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .bm-card.cyan .bm-card-icon { background: var(--cyan-glow); }
        .bm-card.blue .bm-card-icon { background: var(--blue-glow); }
        .bm-card.orange .bm-card-icon { background: var(--orange-glow); }
        .bm-card.teal .bm-card-icon { background: var(--teal-glow); }

        .bm-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .bm-card.cyan .bm-card-kicker { color: var(--cyan); }
        .bm-card.blue .bm-card-kicker { color: var(--blue-bright); }
        .bm-card.orange .bm-card-kicker { color: var(--orange); }
        .bm-card.teal .bm-card-kicker { color: var(--teal); }

        .bm-card-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--chalk);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .bm-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bm-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.022);
          border-left: 2px solid var(--bm-border);
          transition: all 0.15s ease;
        }

        .bm-finding:hover {
          background: rgba(255,255,255,0.038);
        }

        .bm-card.cyan .bm-finding:hover { border-left-color: var(--cyan-dim); }
        .bm-card.blue .bm-finding:hover { border-left-color: var(--blue); }
        .bm-card.orange .bm-finding:hover { border-left-color: var(--orange-dim); }
        .bm-card.teal .bm-finding:hover { border-left-color: var(--teal-dim); }

        .bm-finding-stat {
          flex-shrink: 0;
          min-width: 84px;
        }

        .bm-finding-stat-val {
          font-family: 'Rajdhani', sans-serif;
          font-size: 19px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .bm-card.cyan .bm-finding-stat-val { color: var(--cyan); }
        .bm-card.blue .bm-finding-stat-val { color: var(--blue-bright); }
        .bm-card.orange .bm-finding-stat-val { color: var(--orange); }
        .bm-card.teal .bm-finding-stat-val { color: var(--teal); }

        .bm-finding-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .bm-finding-body { flex: 1; }

        .bm-finding-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 3px;
        }

        .bm-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--chalk-dim);
          line-height: 1.45;
        }

        /* Shuttle viz (decorative) */
        .bm-shuttle-viz {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 28px;
          margin: 20px 0;
        }

        .bm-shuttle-bar {
          flex: 1;
          background: linear-gradient(to top, var(--cyan), var(--blue-bright));
          border-radius: 1px 1px 0 0;
          opacity: 0.35;
          animation: bm-glow-pulse 2s ease-in-out infinite;
        }

        .bm-shuttle-bar:nth-child(odd) { animation-delay: 0.15s; opacity: 0.2; }
        .bm-shuttle-bar:nth-child(3) { opacity: 0.6; }
        .bm-shuttle-bar:nth-child(6) { opacity: 0.8; }
        .bm-shuttle-bar:nth-child(9) { opacity: 0.5; }

        /* Disclaimer */
        .bm-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--bm-surface);
          border: 1px solid var(--bm-border);
          border-left: 3px solid var(--bm-border-mid);
        }

        .bm-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--chalk-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .bm-hero { padding: 56px 0 48px; }
          .bm-card { padding: 24px 18px; }
          .bm-chart-wrap { padding: 24px 18px; }
          .bm-hero-h1 { font-size: 54px; }
          .bm-chart-label { font-size: 11px; }
        }
      `}} />

      <div className="bm-root">
        {/* Header */}
        <header className="bm-header">
          <div className="bm-header-inner">
            <Link href="/workouts" className="bm-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="bm-header-label">Sports Science Series</div>
              <div className="bm-header-title">Badminton Science</div>
            </div>
          </div>
        </header>

        <main className="bm-main">
          {/* Hero */}
          <section className="bm-hero">
            <div className="bm-hero-court" aria-hidden="true">
              <div className="bm-hero-court-line h t10" />
              <div className="bm-hero-court-line h t60" />
              <div className="bm-hero-court-line v l33" />
              <div className="bm-hero-court-line v l66" />
            </div>
            <div className="bm-hero-glow" aria-hidden="true" />

            <div className="bm-hero-tag">World&apos;s Fastest Racket Sport</div>

            <h1 className="bm-hero-h1">
              <span>BADMINTON</span>
              <span className="accent-cyan">PHYSICS</span>
              <span className="accent-outline">&amp; SCIENCE</span>
            </h1>

            <p className="bm-hero-sub">
              The aerodynamics, biomechanics, and physiology behind the fastest object in racket sport. Evidence-based performance research.
            </p>

            <div className="bm-shuttle-viz" aria-hidden="true">
              {[3,2,5,2,8,3,10,2,6,3,9,2,4,2,7,3,5,2,8,4].map((h, i) => (
                <div key={i} className="bm-shuttle-bar" style={{height: `${h * 10}%`}} />
              ))}
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="bm-section-title">Key Statistics</div>
          <div className="bm-stats-grid">
            <div className="bm-stat-tile c1">
              <div className="bm-stat-num">493</div>
              <div className="bm-stat-unit">km/h</div>
              <div className="bm-stat-label">World Record Smash Speed</div>
              <div className="bm-stat-ref">Guinness / Tan Boon Heong, 2013</div>
            </div>
            <div className="bm-stat-tile c2">
              <div className="bm-stat-num">90–92%</div>
              <div className="bm-stat-unit">HRmax</div>
              <div className="bm-stat-label">Average Match Heart Rate</div>
              <div className="bm-stat-ref">Faude 2007</div>
            </div>
            <div className="bm-stat-tile c3">
              <div className="bm-stat-num">85–105</div>
              <div className="bm-stat-unit">ms</div>
              <div className="bm-stat-label">Smash Return Reaction Window</div>
              <div className="bm-stat-ref">Abernethy 1996</div>
            </div>
            <div className="bm-stat-tile c4">
              <div className="bm-stat-num">3–7</div>
              <div className="bm-stat-unit">km</div>
              <div className="bm-stat-label">Distance per Best-of-3 Match</div>
              <div className="bm-stat-ref">Phomsoupha 2015</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bm-section-title">Velocity Comparison</div>
          <div className="bm-chart-wrap">
            <div className="bm-chart-title">Racket Sport Shot Velocities</div>
            <div className="bm-chart-sub">Maximum recorded projectile speeds — badminton shuttle vs. other racket sports</div>
            <div className="bm-chart-rows">
              {chartData.map((row, i) => (
                <div className="bm-chart-row" key={i}>
                  <div className="bm-chart-label">{row.label}</div>
                  <div className="bm-chart-track">
                    <div
                      className="bm-chart-bar"
                      style={{width: `${row.pct}%`, background: `linear-gradient(90deg, ${row.color}22, ${row.color}99)`}}
                    >
                      <span className="bm-chart-val" style={{color: row.color}}>{row.pct}%</span>
                    </div>
                  </div>
                  <div className="bm-chart-kmh" style={{color: row.color}}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="bm-section-title">Research Findings</div>
          <div className="bm-cards-grid">

            {/* Card 1: World's Fastest */}
            <div className="bm-card cyan">
              <div className="bm-card-glow-orb" />
              <div className="bm-card-num">01</div>
              <div className="bm-card-top-row">
                <div className="bm-card-icon">🏸</div>
                <div className="bm-card-kicker">Court Physics</div>
              </div>
              <div className="bm-card-title">The World&apos;s Fastest Racket Sport</div>
              <div className="bm-card-findings">
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">493 km/h</div>
                    <div className="bm-finding-ref">Guinness / Tan 2013</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">World Record Smash Speed</div>
                    <div className="bm-finding-desc">Guinness World Records (Tan Boon Heong, 2013): badminton smash record 493 km/h (306 mph) — the fastest racket-propelled object in sport. Professional competition smashes: 320–420 km/h. Shuttlecock aerodynamics: unique deceleration from 320 km/h at net to 80–100 km/h at rear court due to extreme drag coefficient (CD ≈ 0.6 vs. 0.3 for a tennis ball). This hyperbolic deceleration creates unique opponent timing challenges not present in any other racket sport.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">1.5–3.0 km</div>
                    <div className="bm-finding-ref">Phomsoupha 2015</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Court Coverage per Game</div>
                    <div className="bm-finding-desc">GPS/motion capture in elite badminton: elite singles players cover 1.5–3.0 km per game, executing 350–600 movement changes per match. Multidirectional sprint frequency: 20–30 maximal acceleration efforts per game. Total distance per best-of-3: 3–7 km. Effective playing time per point: 4–6 seconds; recovery: 8–15 seconds. Work-to-rest ratio: approximately 1:2 — higher than tennis, lower than squash.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">90–92%</div>
                    <div className="bm-finding-ref">Faude 2007</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Rally Pace — HRmax Sustained</div>
                    <div className="bm-finding-desc">Elite badminton HR monitoring: during match play, heart rate is sustained at 87–95% HRmax. Mean match HR: 90–92% HRmax for elite singles players. Blood lactate: 3–5 mmol/L during sustained match play. VO₂max requirements: 65–75 mL/kg/min for Olympic-level singles; 58–68 mL/kg/min for doubles specialists.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">16 feathers</div>
                    <div className="bm-finding-ref">Cohen 2016</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Shuttle Aerodynamics</div>
                    <div className="bm-finding-desc">Badminton aerodynamics research: the feathered shuttlecock's 16-feather skirt creates 8–10× more drag than a synthetic nylon shuttle at equivalent velocities. Natural feather shuttles (4.74–5.50 g) are mandatory in international competition. Altitude effect: at 1,500 m, air density reduction requires shuttles with 3 grains heavier weight — BWF regulates shuttle specification by atmospheric conditions.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Biomechanics */}
            <div className="bm-card blue">
              <div className="bm-card-glow-orb" />
              <div className="bm-card-num">02</div>
              <div className="bm-card-top-row">
                <div className="bm-card-icon">⚡</div>
                <div className="bm-card-kicker">Biomechanics</div>
              </div>
              <div className="bm-card-title">Biomechanics &amp; Reaction Science</div>
              <div className="bm-card-findings">
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">85–105 ms</div>
                    <div className="bm-finding-ref">Abernethy 1996</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Smash Return Reaction Window</div>
                    <div className="bm-finding-desc">Occlusion paradigm in badminton: returning a 350 km/h smash from mid-court requires a response initiated within 85–105 ms of shuttle departure — comfortably within the simple reaction time of 200–250 ms, meaning elite defenders cannot react to the shuttle alone. Expert receivers anticipate from body position, racket angle, and swing kinematics up to 250 ms before contact. Defensive ready position and footwork timing are trained cognitive skills, not purely physical reflexes.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">23–28 m/s</div>
                    <div className="bm-finding-ref">Rambely 2005</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Jump Smash Racket Head Speed</div>
                    <div className="bm-finding-desc">Jump smash racket head speed at contact: 23–28 m/s (83–101 km/h). Arm contribution: 45% of total racket head speed; forearm pronation at contact: 38%; wrist snap: 17%. Jump height: 40–60 cm. Shoulder external rotation velocity in preparation: 4,000–4,500°/s — comparable to volleyball spike. Optimal trajectory: shuttle contacted at jump peak, arm fully extended, with 15–20° forward lean for steep angle.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">1.0–1.2 m</div>
                    <div className="bm-finding-ref">Poole 2013</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Net Kill Contact Height</div>
                    <div className="bm-finding-desc">Net kill (sharp downward shot from above tape) requires shuttle contact 1.0–1.2 m above the net for optimal angle. Deceptive preparation reduces opponent reaction time by 80–120 ms. Net cord incidents within 3 ms of shot execution: 15–20% of elite net shots involve unintentional tape contact. Net feint training improves deception effectiveness 25% in 6-week intervention studies.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">50–80 ms</div>
                    <div className="bm-finding-ref">Lees 2003</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Footwork: 9 Fundamental Patterns</div>
                    <div className="bm-finding-desc">Badminton footwork taxonomy: 9 fundamental court movement patterns (6 corners + central ready position + lunge + split-step). Lunge depth in extreme net shots: 70–90 cm. Split-step timing: 50–80 ms before opponent contact — pre-loads lower limbs in bilateral isometric contraction before explosive direction change. Footwork efficiency accounts for 35% of variance in rally outcome at elite level — more than racket skill in multivariate analysis.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Physiology */}
            <div className="bm-card orange">
              <div className="bm-card-glow-orb" />
              <div className="bm-card-num">03</div>
              <div className="bm-card-top-row">
                <div className="bm-card-icon">❤️</div>
                <div className="bm-card-kicker">Physiology</div>
              </div>
              <div className="bm-card-title">Physical Conditioning &amp; Physiology</div>
              <div className="bm-card-findings">
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">28%</div>
                    <div className="bm-finding-ref">Yung 2007</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Shoulder Injuries — Dominant Injury Type</div>
                    <div className="bm-finding-desc">BWF injury survey: shoulder injuries account for 28% of all time-loss injuries in elite badminton. Supraspinatus tendinopathy and infraspinatus strains from high-volume overhead striking. Prevention: rotator cuff eccentric programme (ER side-lying, prone Y/T/W raises), posterior capsule flexibility maintenance, and progressive stroke volume periodisation avoiding &gt;10% weekly increase. Backhand clear: highest shoulder impingement risk due to awkward abduction-internal rotation combination at overhead contact.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">15–25%</div>
                    <div className="bm-finding-ref">Lo 2004</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Patellar Tendinopathy Prevalence</div>
                    <div className="bm-finding-desc">Patellar tendinopathy (jumper&apos;s knee) prevalence in elite badminton: 15–25%. Risk factors: high jump smash frequency (&gt;200/session), training surface hardness, and quad-hamstring strength imbalance (ratio &lt;0.75). Prevention: eccentric decline squat protocol (3 × 15 reps/day on 25° board) reduces pain 60% over 12 weeks. Playing through tendinopathy acceptable with VAS &lt;4/10; &gt;5/10 requires load modification.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">1–2.5% BW</div>
                    <div className="bm-finding-ref">Girard 2012</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Dehydration Risk per Game</div>
                    <div className="bm-finding-desc">Elite players lose 1–2.5% body weight per game (45–75 min) through sweat at 24–28°C indoor courts. Performance impairment threshold: 2% dehydration reduces reaction time 7%, decision accuracy 11%, and movement speed 4%. High sweat rates (1.0–1.8 L/hour) with up to 4 games/day in tournaments require systematic hydration: 400–600 mL 2 hours before, 150–200 mL every 15 min during play, immediate electrolyte replacement post-game.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">6–8 sessions</div>
                    <div className="bm-finding-ref">Phomsoupha 2015</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Elite Weekly Training Load</div>
                    <div className="bm-finding-desc">Olympic badminton players average 6–8 training sessions per week of 90–120 min each. Distribution: 50% technical (strokes, footwork drills), 30% match practice, 20% physical conditioning. Multi-shuttle drills (feeder delivers rapid succession shuttles to all 6 corners): highest training physiological demand, reaching 95% HRmax. Peak preparation: increase multi-shuttle volume 4–6 weeks before major competition.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Doubles */}
            <div className="bm-card teal">
              <div className="bm-card-glow-orb" />
              <div className="bm-card-num">04</div>
              <div className="bm-card-top-row">
                <div className="bm-card-icon">📊</div>
                <div className="bm-card-kicker">Tactics &amp; Equipment</div>
              </div>
              <div className="bm-card-title">Doubles Tactics &amp; Court Science</div>
              <div className="bm-card-findings">
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">4.5 s</div>
                    <div className="bm-finding-ref">Laffaye 2015</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Doubles Rally Duration</div>
                    <div className="bm-finding-desc">Doubles rallies average 4.5 s vs. 8.5 s for singles — reflecting attack-dominant doubles structure where offensive opportunities are converted immediately. Mixed doubles rally duration: 5.2 s. BWF service height rule (shuttle waist &lt;1.15 m) has transformed tactical play toward drive and push returns. Side-by-side vs. front-back positioning: side-by-side for 72% of rally time; positional decisions made within 50–80 ms of shuttle direction.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">68% wins</div>
                    <div className="bm-finding-ref">Lees 2010</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Service Science</div>
                    <div className="bm-finding-desc">Legal doubles service: shuttle must cross at least 15 cm above the net. Outcome data: low serve + net return wins rally at 68% frequency vs. 51% for flick service sequences — supporting dominant low-serve strategy in modern doubles. Service deception (flick with low-serve preparation): successfully deceives opponent 35–50% of attempts at elite level.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">20–30°</div>
                    <div className="bm-finding-ref">Wan Abas 2002</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Optimal Smash Trajectory</div>
                    <div className="bm-finding-desc">Optimal badminton smash trajectory for court coverage: 20–30° angle from horizontal, targeting side tramlines at mid-court. Steeper angles (&gt;30°) miss the tramline zone; shallower (&lt;20°) are easier to defend. Half-smash tactical use: 60–70% of smash speed used intentionally to draw forward movement, enabling deceptive drop or follow-up full smash.</div>
                  </div>
                </div>
                <div className="bm-finding">
                  <div className="bm-finding-stat">
                    <div className="bm-finding-stat-val">26–30 lbs</div>
                    <div className="bm-finding-ref">Tsai 2000</div>
                  </div>
                  <div className="bm-finding-body">
                    <div className="bm-finding-title">Racket String Tension</div>
                    <div className="bm-finding-desc">Elite players string at 26–30 lbs tension (vs. recreational 18–22 lbs). Higher tension: reduces contact time, increases control, requires higher swing speed. Racket head speed contributes 65% to shuttle speed; string tension 15%; shuttle quality 20%. Graphite shaft stiffness: medium-stiff optimal for most offensive players; flexible shaft transfers more energy at lower swing speeds (recreational players).</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="bm-disclaimer">
            <div className="bm-disclaimer-text">
              DISCLAIMER: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing players. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
