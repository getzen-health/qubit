import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Table Tennis Science' }

export default function TableTennisSciencePage() {
  const chartData = [
    { label: 'Heavy topspin loop', value: 9000, pct: 100, color: '#f97316' },
    { label: 'Backspin chop',       value: 7000, pct: 78,  color: '#ef4444' },
    { label: 'Standard topspin',    value: 5500, pct: 61,  color: '#f59e0b' },
    { label: 'Sidespin serve',      value: 4500, pct: 50,  color: '#eab308' },
    { label: 'No-spin ghost serve', value: 300,  pct: 3,   color: '#6b7280' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Barlow+Condensed:wght@400;500;600;700&display=swap');

        :root {
          --tt-black: #080c14;
          --tt-dark: #0c1020;
          --tt-surface: #101524;
          --tt-surface-2: #141a2c;
          --tt-border: #1c2438;
          --tt-border-mid: #243050;
          --orange: #f97316;
          --orange-dim: #b34d0a;
          --orange-glow: rgba(249, 115, 22, 0.13);
          --orange-glow-lg: rgba(249, 115, 22, 0.06);
          --red: #ef4444;
          --red-dim: #991b1b;
          --red-glow: rgba(239, 68, 68, 0.12);
          --blue: #3b82f6;
          --blue-dim: #1d4ed8;
          --blue-glow: rgba(59, 130, 246, 0.12);
          --green: #10b981;
          --green-dim: #065f46;
          --green-glow: rgba(16, 185, 129, 0.12);
          --chalk: #e8edf6;
          --chalk-dim: #7a8aa8;
          --chalk-faint: #1e2840;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .tt-root {
          min-height: 100vh;
          background-color: var(--tt-black);
          color: var(--chalk);
          font-family: 'Nunito', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .tt-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.038;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Table green underlay */
        .tt-root::after {
          content: '';
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30vh;
          background: linear-gradient(to top, rgba(16, 185, 129, 0.025), transparent);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .tt-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(8, 12, 20, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--tt-border);
        }

        .tt-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tt-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          color: var(--chalk-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .tt-back-btn:hover {
          background: var(--tt-surface-2);
          border-color: var(--orange-dim);
          color: var(--orange);
        }

        .tt-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--orange-dim);
        }

        .tt-header-title {
          font-family: 'Nunito', sans-serif;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--chalk);
          text-transform: uppercase;
        }

        /* Main */
        .tt-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .tt-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: tt-fade-up 0.6s ease both;
        }

        @keyframes tt-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes tt-bar-grow {
          from { width: 0; }
        }

        @keyframes tt-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes tt-pulse-orange {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }

        /* Table net line in hero */
        .tt-hero-net {
          position: absolute;
          top: 0; bottom: 0;
          left: 50%;
          width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(249, 115, 22, 0.1) 30%, rgba(249, 115, 22, 0.1) 70%, transparent);
          transform: translateX(-50%);
          pointer-events: none;
        }

        /* Hero ball decoration */
        .tt-hero-ball {
          position: absolute;
          top: 60px;
          right: 60px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #f97316, #c2410c);
          opacity: 0.12;
          animation: tt-spin 12s linear infinite;
          pointer-events: none;
        }

        .tt-hero-ball::after {
          content: '';
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: rgba(0,0,0,0.3);
          transform: translateY(-50%);
        }

        /* Glow blob */
        .tt-hero-glow {
          position: absolute;
          top: -40px;
          left: -60px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .tt-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--orange);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tt-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, var(--orange), transparent);
        }

        .tt-hero-h1 {
          font-family: 'Nunito', sans-serif;
          font-size: clamp(50px, 9.5vw, 112px);
          line-height: 0.9;
          letter-spacing: -0.02em;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 10px;
        }

        .tt-hero-h1 .accent-orange {
          color: var(--orange);
          display: block;
          text-shadow: 0 0 50px rgba(249, 115, 22, 0.25);
        }

        .tt-hero-h1 .accent-outline {
          -webkit-text-stroke: 1.5px var(--red);
          color: transparent;
          display: block;
        }

        .tt-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(16px, 2.4vw, 22px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 22px;
          max-width: 620px;
          line-height: 1.35;
        }

        /* Spin indicator bars */
        .tt-spin-viz {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 24px;
          margin: 24px 0;
        }

        .tt-spin-bar {
          width: 3px;
          border-radius: 2px;
          background: var(--orange);
          animation: tt-pulse-orange 1.8s ease-in-out infinite;
        }

        /* Key stats grid */
        .tt-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: tt-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .tt-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .tt-stat-tile {
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .tt-stat-tile::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }

        .tt-stat-tile.c1::before { background: var(--orange); }
        .tt-stat-tile.c2::before { background: var(--blue); }
        .tt-stat-tile.c3::before { background: var(--red); }
        .tt-stat-tile.c4::before { background: var(--green); }

        .tt-stat-tile:hover { border-color: var(--tt-border-mid); }

        .tt-stat-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 28px;
          font-weight: 600;
          line-height: 1;
          color: var(--chalk);
        }

        .tt-stat-tile.c1 .tt-stat-num { color: var(--orange); }
        .tt-stat-tile.c2 .tt-stat-num { color: var(--blue); }
        .tt-stat-tile.c3 .tt-stat-num { color: var(--red); }
        .tt-stat-tile.c4 .tt-stat-num { color: var(--green); }

        .tt-stat-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--chalk-dim);
          margin-top: 3px;
          letter-spacing: 0.05em;
        }

        .tt-stat-label {
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 10px;
          line-height: 1.2;
        }

        .tt-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-faint);
          margin-top: 5px;
          letter-spacing: 0.04em;
        }

        /* Section label */
        .tt-section-title {
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

        .tt-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--tt-border);
        }

        /* Chart */
        .tt-chart-wrap {
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: tt-fade-up 0.5s ease 0.15s both;
        }

        .tt-chart-title {
          font-family: 'Nunito', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 4px;
        }

        .tt-chart-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          color: var(--chalk-dim);
          margin-bottom: 28px;
        }

        .tt-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tt-chart-row {
          display: grid;
          grid-template-columns: 180px 1fr 80px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .tt-chart-row {
            grid-template-columns: 120px 1fr 56px;
            gap: 8px;
          }
        }

        .tt-chart-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          text-align: right;
        }

        .tt-chart-track {
          height: 30px;
          background: var(--tt-surface-2);
          border: 1px solid var(--tt-border);
          position: relative;
          overflow: hidden;
        }

        .tt-chart-bar {
          height: 100%;
          position: absolute;
          left: 0; top: 0;
          animation: tt-bar-grow 1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .tt-chart-pct {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }

        .tt-chart-rpm {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }

        /* Science cards grid */
        .tt-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .tt-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .tt-card {
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: tt-fade-up 0.5s ease both;
        }

        .tt-card:nth-child(1) { animation-delay: 0.0s; }
        .tt-card:nth-child(2) { animation-delay: 0.07s; }
        .tt-card:nth-child(3) { animation-delay: 0.14s; }
        .tt-card:nth-child(4) { animation-delay: 0.21s; }

        .tt-card:hover { border-color: var(--tt-border-mid); }

        .tt-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .tt-card.orange::before { background: var(--orange); }
        .tt-card.blue::before   { background: var(--blue); }
        .tt-card.red::before    { background: var(--red); }
        .tt-card.green::before  { background: var(--green); }

        .tt-card.orange:hover { box-shadow: inset 0 0 80px var(--orange-glow-lg); }
        .tt-card.blue:hover   { box-shadow: inset 0 0 80px var(--blue-glow); }
        .tt-card.red:hover    { box-shadow: inset 0 0 80px var(--red-glow); }
        .tt-card.green:hover  { box-shadow: inset 0 0 80px var(--green-glow); }

        .tt-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 200px; height: 200px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .tt-card.orange .tt-card-glow-orb { background: var(--orange-glow); }
        .tt-card.blue   .tt-card-glow-orb { background: var(--blue-glow); }
        .tt-card.red    .tt-card-glow-orb { background: var(--red-glow); }
        .tt-card.green  .tt-card-glow-orb { background: var(--green-glow); }

        .tt-card-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 72px;
          font-weight: 600;
          line-height: 1;
          position: absolute;
          top: 20px; right: 24px;
          opacity: 0.055;
          pointer-events: none;
          letter-spacing: -0.04em;
        }

        .tt-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .tt-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .tt-card.orange .tt-card-icon { background: var(--orange-glow); }
        .tt-card.blue   .tt-card-icon { background: var(--blue-glow); }
        .tt-card.red    .tt-card-icon { background: var(--red-glow); }
        .tt-card.green  .tt-card-icon { background: var(--green-glow); }

        .tt-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .tt-card.orange .tt-card-kicker { color: var(--orange); }
        .tt-card.blue   .tt-card-kicker { color: var(--blue); }
        .tt-card.red    .tt-card-kicker { color: var(--red); }
        .tt-card.green  .tt-card-kicker { color: var(--green); }

        .tt-card-title {
          font-family: 'Nunito', sans-serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: var(--chalk);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .tt-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tt-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.022);
          border-left: 2px solid var(--tt-border);
          transition: all 0.15s ease;
        }

        .tt-finding:hover { background: rgba(255,255,255,0.038); }

        .tt-card.orange .tt-finding:hover { border-left-color: var(--orange-dim); }
        .tt-card.blue   .tt-finding:hover { border-left-color: var(--blue-dim); }
        .tt-card.red    .tt-finding:hover { border-left-color: var(--red-dim); }
        .tt-card.green  .tt-finding:hover { border-left-color: var(--green-dim); }

        .tt-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .tt-finding-stat-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
        }

        .tt-card.orange .tt-finding-stat-val { color: var(--orange); }
        .tt-card.blue   .tt-finding-stat-val { color: var(--blue); }
        .tt-card.red    .tt-finding-stat-val { color: var(--red); }
        .tt-card.green  .tt-finding-stat-val { color: var(--green); }

        .tt-finding-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          margin-top: 3px;
          letter-spacing: 0.04em;
        }

        .tt-finding-body { flex: 1; }

        .tt-finding-title {
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 3px;
        }

        .tt-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--chalk-dim);
          line-height: 1.45;
        }

        /* Disclaimer */
        .tt-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--tt-surface);
          border: 1px solid var(--tt-border);
          border-left: 3px solid var(--tt-border-mid);
        }

        .tt-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--chalk-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .tt-hero { padding: 56px 0 48px; }
          .tt-card { padding: 24px 18px; }
          .tt-chart-wrap { padding: 24px 18px; }
          .tt-hero-h1 { font-size: 50px; }
          .tt-chart-label { font-size: 11px; }
        }
      `}} />

      <div className="tt-root">
        {/* Header */}
        <header className="tt-header">
          <div className="tt-header-inner">
            <Link href="/workouts" className="tt-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="tt-header-label">Sports Science Series</div>
              <div className="tt-header-title">Table Tennis Science</div>
            </div>
          </div>
        </header>

        <main className="tt-main">
          {/* Hero */}
          <section className="tt-hero">
            <div className="tt-hero-net" aria-hidden="true" />
            <div className="tt-hero-ball" aria-hidden="true" />
            <div className="tt-hero-glow" aria-hidden="true" />

            <div className="tt-hero-tag">Fastest Reaction Sport on Earth</div>

            <h1 className="tt-hero-h1">
              <span>TABLE</span>
              <span className="accent-orange">TENNIS</span>
              <span className="accent-outline">SCIENCE</span>
            </h1>

            <p className="tt-hero-sub">
              The spin physics, reaction neuroscience, and biomechanics behind the world&apos;s most technically demanding racket sport.
            </p>

            {/* Spin viz */}
            <div className="tt-spin-viz" aria-hidden="true">
              {[20,30,55,20,70,25,100,20,45,30,85,20,60,25,40,20,75,30,50,20].map((h, i) => (
                <div
                  key={i}
                  className="tt-spin-bar"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.06}s`,
                    opacity: h > 60 ? 0.9 : 0.4,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="tt-section-title">Key Statistics</div>
          <div className="tt-stats-grid">
            <div className="tt-stat-tile c1">
              <div className="tt-stat-num">9,000</div>
              <div className="tt-stat-unit">rpm</div>
              <div className="tt-stat-label">Maximum Topspin Loop Spin Rate</div>
              <div className="tt-stat-ref">Zhang 2013, World Championships</div>
            </div>
            <div className="tt-stat-tile c2">
              <div className="tt-stat-num">140–175</div>
              <div className="tt-stat-unit">ms</div>
              <div className="tt-stat-label">Elite Player Simple Reaction Time</div>
              <div className="tt-stat-ref">Mori 2002</div>
            </div>
            <div className="tt-stat-tile c3">
              <div className="tt-stat-num">60–70%</div>
              <div className="tt-stat-unit">of points</div>
              <div className="tt-stat-label">Decided by Serve + 3rd Ball</div>
              <div className="tt-stat-ref">Li 2015, ITTF data</div>
            </div>
            <div className="tt-stat-tile c4">
              <div className="tt-stat-num">6–8 h</div>
              <div className="tt-stat-unit">per day</div>
              <div className="tt-stat-label">Chinese Elite Training Volume</div>
              <div className="tt-stat-ref">ITTF Coaching Commission</div>
            </div>
          </div>

          {/* Spin Chart */}
          <div className="tt-section-title">Spin Comparison</div>
          <div className="tt-chart-wrap">
            <div className="tt-chart-title">Ball Spin Rate by Shot Type</div>
            <div className="tt-chart-sub">Measured at World Championship level — Zhang 2013 spin quantification study</div>
            <div className="tt-chart-rows">
              {chartData.map((row, i) => (
                <div className="tt-chart-row" key={i}>
                  <div className="tt-chart-label">{row.label}</div>
                  <div className="tt-chart-track">
                    <div
                      className="tt-chart-bar"
                      style={{width: `${row.pct}%`, background: `linear-gradient(90deg, ${row.color}25, ${row.color}88)`}}
                    >
                      <span className="tt-chart-pct" style={{color: row.color}}>{row.pct}%</span>
                    </div>
                  </div>
                  <div className="tt-chart-rpm" style={{color: row.color, fontFamily: "'IBM Plex Mono', monospace"}}>
                    {row.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="tt-section-title">Research Findings</div>
          <div className="tt-cards-grid">

            {/* Card 1: Reaction & Ball Physics */}
            <div className="tt-card orange">
              <div className="tt-card-glow-orb" />
              <div className="tt-card-num">01</div>
              <div className="tt-card-top-row">
                <div className="tt-card-icon">🏓</div>
                <div className="tt-card-kicker">Ball Physics</div>
              </div>
              <div className="tt-card-title">Reaction Time &amp; Ball Physics</div>
              <div className="tt-card-findings">
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">70–112 km/h</div>
                    <div className="tt-finding-ref">Bankosz 2012</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Elite Topspin Drive Speed</div>
                    <div className="tt-finding-desc">Motion analysis, elite table tennis: topspin drive speeds range 70–90 km/h for forehand loop and 80–112 km/h for forehand loop kill from mid-table. Flight time from 2.74 m (table length) at 100 km/h: 98 ms — meaning the total time from bat contact to opponent reach is &lt;100 ms. Elite players anticipate ball flight entirely from pre-contact preparation (stance, bat angle, swing initiation) rather than post-contact ball tracking.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">140–175 ms</div>
                    <div className="tt-finding-ref">Mori 2002</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Top 1% Human Reaction Time</div>
                    <div className="tt-finding-desc">Elite table tennis players demonstrate simple reaction times of 140–175 ms vs. 200–250 ms in age-matched non-athletes — the fastest reaction times documented in any athlete cohort. However, simple RT explains only 15% of match performance variance. The dominant factor is sport-specific reaction time — integrating anticipation cues, tactical positioning, and movement pre-programming to achieve effective responses 50–80 ms faster than simple RT would suggest.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">9,000 rpm</div>
                    <div className="tt-finding-ref">Zhang 2013</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Maximum Spin Rates</div>
                    <div className="tt-finding-desc">Spin measurement, World Championships: topspin loop 3,000–5,500 rpm; backspin chop 4,000–7,000 rpm; sidespin serve 2,000–4,500 rpm; heavy topspin loop kill 6,000–9,000 rpm. 7,000 rpm backspin causes ball to decelerate sharply; 9,000 rpm topspin causes violent forward kick after bounce. Elite returners process spin direction within 100 ms of opponent contact using grip/wrist observation.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">38→40 mm</div>
                    <div className="tt-finding-ref">ITTF 2000/2015</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Ball Size Change — Game Physics</div>
                    <div className="tt-finding-desc">ITTF changed ball diameter from 38mm to 40mm in 2000, then to poly 40+ in 2015. Larger diameter increases drag, reducing max speeds and spin retention. Effect: point duration increased 15–20%; service spin effectiveness reduced 10–15% (poly ball absorbs less spin than celluloid). Speed glue banned 2008: reduced forehand loop speed from 110–120 km/h to 80–100 km/h, fundamentally altering tactical structures toward longer rallies.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Biomechanics */}
            <div className="tt-card blue">
              <div className="tt-card-glow-orb" />
              <div className="tt-card-num">02</div>
              <div className="tt-card-top-row">
                <div className="tt-card-icon">⚡</div>
                <div className="tt-card-kicker">Biomechanics</div>
              </div>
              <div className="tt-card-title">Technique Biomechanics</div>
              <div className="tt-card-findings">
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">900–1,400°/s</div>
                    <div className="tt-finding-ref">Iimoto 2011</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Forehand Loop Wrist Angular Velocity</div>
                    <div className="tt-finding-desc">3D motion capture, world-class players: forehand topspin loop generates wrist angular velocity of 900–1,400°/s at contact — the primary determinant of spin generation. Kinetic chain: hip rotation (first) → trunk rotation → shoulder adduction → elbow flexion → forearm pronation → wrist flexion. Contact point: &apos;catching&apos; the ball (grazing upward) at the apex of bounce maximises dwell time. Contact time: 2–4 ms — within this window, wrist acceleration is the only controllable variable.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">0.4 s</div>
                    <div className="tt-finding-ref">Kasai 2010</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Backhand Flick Preparation Window</div>
                    <div className="tt-finding-desc">Backhand biomechanics: the backhand flick (attacking short balls with backhand) must be completed within 0.4 s from reading opponent&apos;s short shot. Elbow leads the swing; forearm supination generates topspin. This technique is the defining skill separating elite from sub-elite modern players — enables attack from any ball position without forehand movement exposure. Development: 10–15% performance improvement per 6-month deliberate practice block.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">60–70%</div>
                    <div className="tt-finding-ref">Li 2015</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Serve + 3rd Ball Dominance</div>
                    <div className="tt-finding-desc">ITTF match data analysis: serve and third-ball determines 60–70% of elite match points. Serve variation taxonomy: pendulum (sidespin), reverse pendulum, tomahawk (backspin/topspin from backhand), ghost serve (no-spin disguised as topspin). Elbow and wrist deceleration (soft contact) produces no-spin serves that mimic heavy-spin preparation motions.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">0.3–0.4 s</div>
                    <div className="tt-finding-ref">Munivrana 2015</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Footwork Completion Time</div>
                    <div className="tt-finding-desc">Elite footwork patterns — side-to-side shuffle, crossover step, adjustment step — must be completed in 0.3–0.4 s. Split-step (bilateral jump landing) reduces initial step reaction time 20–40 ms vs. static stance. Footwork volume: elite players complete 40–60 positioning events per rally-intensive training hour. Dominant training modalities: lateral plyometric hops, speed ladder drills, reactive footwork (random direction stimulus response).</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Physiology */}
            <div className="tt-card red">
              <div className="tt-card-glow-orb" />
              <div className="tt-card-num">03</div>
              <div className="tt-card-top-row">
                <div className="tt-card-icon">❤️</div>
                <div className="tt-card-kicker">Physiology</div>
              </div>
              <div className="tt-card-title">Physiology &amp; Training Science</div>
              <div className="tt-card-findings">
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">55–62 mL/kg/min</div>
                    <div className="tt-finding-ref">Zagatto 2011</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">VO₂max — Olympic Level</div>
                    <div className="tt-finding-desc">Elite table tennis VO₂max: 55–62 mL/kg/min for Olympic men; 48–55 mL/kg/min for Olympic women. HR during match play: 75–88% HRmax for active rally phases; 55–65% between points. Blood lactate: 2–4 mmol/L — lower than most racket sports, reflecting short rallies (average 4 shots/rally). Aerobic capacity is important for recovery between sets and 5-set match endurance rather than individual rally intensity.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">25–35%</div>
                    <div className="tt-finding-ref">Zhang 2017</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Wrist &amp; Elbow Tendinopathy Rate</div>
                    <div className="tt-finding-desc">ITTF Medical Commission: forearm tendinopathy (primarily extensor carpi ulnaris, lateral epicondylar) prevalence in Chinese National Team: 25–35%. Causative factors: forehand loop volume (2,000–4,000 strokes/session), narrow wrist movement patterns, early specialisation. Prevention: wrist pronation-supination antagonist strengthening, forearm stretching post-session, ice massage after high-volume sessions. Optimal grip pressure: 3–4 out of 5 — excess tension impairs wrist snap and accelerates forearm fatigue.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">6–8 h/day</div>
                    <div className="tt-finding-ref">ITTF Commission</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Chinese Elite Training Model</div>
                    <div className="tt-finding-desc">Chinese National Team: elite juniors and seniors average 6–8 hours/day of structured practice, including 3–4 hours multi-ball drilling, 2–3 hours partner sparring, and 1–2 hours physical conditioning. Weekly training volume: 35–50 hours — among the highest of any sport. Early specialisation: pathway begins at age 5–7. Average time from structured training to first world ranking: 12–15 years.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">18–28% less decline</div>
                    <div className="tt-finding-ref">Lidor 2010</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Pre-Point Routines — Psychology</div>
                    <div className="tt-finding-desc">Sport psychology in table tennis: players with structured between-point routines (bounce ball, breath, focal cue word) show 18–28% lower performance decline under high-stakes scoring. Optimal routine duration: 8–15 s — shorter (&lt;6 s) insufficient for arousal regulation; longer (&gt;20 s) impairs match rhythm. Mental training is mandatory in Chinese National Programme from junior entry: imagery, self-talk scripts, and pressure training protocols.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Equipment */}
            <div className="tt-card green">
              <div className="tt-card-glow-orb" />
              <div className="tt-card-num">04</div>
              <div className="tt-card-top-row">
                <div className="tt-card-icon">🔬</div>
                <div className="tt-card-kicker">Equipment Science</div>
              </div>
              <div className="tt-card-title">Equipment Science &amp; Rubbers</div>
              <div className="tt-card-findings">
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">2.0–2.1 mm</div>
                    <div className="tt-finding-ref">Theiner 2019</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Optimal Rubber Sponge Thickness</div>
                    <div className="tt-finding-desc">ITTF equipment testing: maximum rubber thickness 4 mm total (blade + rubber sheet). Sponge thickness 2.0–2.1 mm: optimal balance of speed, control, and vibration dampening. Inverted rubber (pimples-facing-in): used by 95% of elite players for topspin loop forehand. Long-pips rubber: causes ball to return with opposite spin (topspin input → backspin output), creating returns that confuse timing. Anti-spin rubber: eliminates spin, returns near-zero-spin regardless of incoming spin.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">+15–20%</div>
                    <div className="tt-finding-ref">Bankosz 2020</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Carbon Blade Speed Advantage</div>
                    <div className="tt-finding-desc">Blade materials comparison: carbon-fibre layer blades (1–3 carbon layers in 5–7 ply construction) increase ball exit velocity 15–20% vs. all-wood blades of equivalent weight. Carbon blades allow higher stroke velocities; however, dwell time decreases proportionally — reducing spin generation and off-centre forgiveness. Most elite attackers use 1–2 carbon layer blades (balanced speed-control); defensive players prefer all-wood or glass-fibre for maximum dwell time.</div>
                  </div>
                </div>
                <div className="tt-finding">
                  <div className="tt-finding-stat">
                    <div className="tt-finding-stat-val">2.74 × 1.525 m</div>
                    <div className="tt-finding-ref">ITTF Regulations</div>
                  </div>
                  <div className="tt-finding-body">
                    <div className="tt-finding-title">Table Physics &amp; Net Clearance</div>
                    <div className="tt-finding-desc">ITTF regulations: table 2.74 m × 1.525 m, 76 cm height; net 15.25 cm high. Ball arc height over net: topspin loop crosses 3–8 cm above net for maximum consistency while maintaining attack angle. Net clearance probability: topspin shots clear net with 95% probability at 5+ cm clearance; speed flat drives require &lt;2 cm clearance and have 30% net error rate. Long-pips/chop returns cross net at 10–20 cm height due to backspin deceleration arc — visually distinctive trajectory used to disrupt opponent timing.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="tt-disclaimer">
            <div className="tt-disclaimer-text">
              DISCLAIMER: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies including ITTF. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing players. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
