import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Squash Science | KQuarks' }

export default function SquashSciencePage() {
  const chartData = [
    { label: 'Squash', ratio: '3:1', pct: 100, colorA: '#ff6b00', colorB: '#ffab00', note: '' },
    { label: 'Badminton', ratio: '1:2', pct: 33, colorA: '#ffab00', colorB: '#ff6b00', note: '' },
    { label: 'Tennis', ratio: '1:3', pct: 25, colorA: '#ff6b00', colorB: '#ffab00', note: '' },
    { label: 'Table Tennis', ratio: '1:4', pct: 20, colorA: '#ffab00', colorB: '#ff6b00', note: '' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;600&family=Inter:wght@400;500;600&display=swap');

        :root {
          --sq-dark: #111111;
          --sq-orange: #ff6b00;
          --sq-amber: #ffab00;
          --sq-text: #f0ece4;
          --sq-surface: #1a1a1a;
          --sq-surface-2: #222222;
          --sq-border: #2a2a2a;
          --sq-border-mid: #3a3a3a;
          --sq-orange-glow: rgba(255, 107, 0, 0.12);
          --sq-orange-glow-lg: rgba(255, 107, 0, 0.06);
          --sq-amber-glow: rgba(255, 171, 0, 0.12);
          --sq-amber-glow-lg: rgba(255, 171, 0, 0.06);
          --sq-text-dim: #8a8070;
          --sq-text-faint: #2a2520;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sq-root {
          min-height: 100vh;
          background-color: var(--sq-dark);
          color: var(--sq-text);
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .sq-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Radial glow */
        .sq-root::after {
          content: '';
          position: fixed;
          top: -30vh;
          left: 50%;
          transform: translateX(-50%);
          width: 200vw;
          height: 70vh;
          background: radial-gradient(ellipse at top, rgba(255, 107, 0, 0.05) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .sq-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(17, 17, 17, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--sq-border);
        }

        .sq-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sq-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--sq-surface);
          border: 1px solid var(--sq-border);
          color: var(--sq-text-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .sq-back-btn:hover {
          background: var(--sq-surface-2);
          border-color: var(--sq-orange);
          color: var(--sq-orange);
        }

        .sq-header-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sq-orange);
          opacity: 0.7;
        }

        .sq-header-title {
          font-family: 'Teko', sans-serif;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--sq-text);
          text-transform: uppercase;
        }

        /* Main */
        .sq-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .sq-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: sq-fade-up 0.6s ease both;
        }

        @keyframes sq-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sq-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes sq-bar-grow {
          from { width: 0; }
        }

        /* Squash court SVG decoration */
        .sq-hero-court {
          position: absolute;
          top: 0; right: -40px;
          width: 380px;
          height: 100%;
          pointer-events: none;
          opacity: 0.055;
        }

        /* Glow blob */
        .sq-hero-glow {
          position: absolute;
          top: -80px;
          right: -60px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 107, 0, 0.09) 0%, rgba(255, 171, 0, 0.04) 50%, transparent 70%);
          pointer-events: none;
          animation: sq-glow-pulse 5s ease-in-out infinite;
        }

        .sq-hero-tag {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--sq-orange);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sq-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--sq-orange));
        }

        .sq-hero-h1 {
          font-family: 'Teko', sans-serif;
          font-size: clamp(56px, 10vw, 116px);
          line-height: 0.9;
          letter-spacing: 0.02em;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--sq-text);
          margin-bottom: 10px;
        }

        .sq-hero-h1 .accent-orange {
          color: var(--sq-orange);
          display: block;
          text-shadow: 0 0 60px rgba(255, 107, 0, 0.35);
        }

        .sq-hero-h1 .accent-outline {
          -webkit-text-stroke: 1px var(--sq-amber);
          color: transparent;
          display: block;
        }

        .sq-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: clamp(14px, 2vw, 17px);
          font-weight: 400;
          color: var(--sq-text-dim);
          margin-top: 22px;
          max-width: 600px;
          line-height: 1.6;
        }

        /* Court dot pulse decoration */
        .sq-court-dots {
          display: flex;
          gap: 6px;
          margin: 20px 0;
          align-items: center;
        }

        .sq-court-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sq-orange);
          animation: sq-glow-pulse 2s ease-in-out infinite;
        }

        .sq-court-dot:nth-child(2) { animation-delay: 0.3s; opacity: 0.7; }
        .sq-court-dot:nth-child(3) { animation-delay: 0.6s; opacity: 0.5; }
        .sq-court-dot:nth-child(4) { background: var(--sq-amber); animation-delay: 0.9s; opacity: 0.6; }
        .sq-court-dot:nth-child(5) { background: var(--sq-amber); animation-delay: 1.2s; opacity: 0.4; }

        /* Key stats grid */
        .sq-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: sq-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .sq-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .sq-stat-tile {
          background: var(--sq-surface);
          border: 1px solid var(--sq-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .sq-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .sq-stat-tile.c1::before { background: var(--sq-orange); }
        .sq-stat-tile.c2::before { background: var(--sq-amber); }
        .sq-stat-tile.c3::before { background: var(--sq-orange); }
        .sq-stat-tile.c4::before { background: var(--sq-amber); }

        .sq-stat-tile:hover { border-color: var(--sq-border-mid); }

        .sq-stat-num {
          font-family: 'Teko', sans-serif;
          font-size: 36px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.02em;
        }

        .sq-stat-tile.c1 .sq-stat-num { color: var(--sq-orange); }
        .sq-stat-tile.c2 .sq-stat-num { color: var(--sq-amber); }
        .sq-stat-tile.c3 .sq-stat-num { color: var(--sq-orange); }
        .sq-stat-tile.c4 .sq-stat-num { color: var(--sq-amber); }

        .sq-stat-unit {
          font-family: 'Inter', monospace;
          font-size: 11px;
          color: var(--sq-text-dim);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .sq-stat-label {
          font-family: 'Teko', sans-serif;
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sq-text-dim);
          margin-top: 8px;
        }

        .sq-stat-ref {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          color: var(--sq-text-faint);
          margin-top: 4px;
          letter-spacing: 0.04em;
        }

        /* Section label */
        .sq-section-title {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--sq-text-dim);
          margin: 48px 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sq-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--sq-border);
        }

        /* Chart section */
        .sq-chart-wrap {
          background: var(--sq-surface);
          border: 1px solid var(--sq-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: sq-fade-up 0.5s ease 0.15s both;
          position: relative;
          overflow: hidden;
        }

        .sq-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--sq-orange), var(--sq-amber));
        }

        .sq-chart-title {
          font-family: 'Teko', sans-serif;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--sq-text);
          margin-bottom: 6px;
        }

        .sq-chart-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: var(--sq-text-dim);
          margin-bottom: 28px;
        }

        .sq-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sq-chart-row {
          display: grid;
          grid-template-columns: 140px 1fr 64px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .sq-chart-row {
            grid-template-columns: 100px 1fr 52px;
            gap: 8px;
          }
        }

        .sq-chart-label {
          font-family: 'Teko', sans-serif;
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sq-text-dim);
          text-align: right;
        }

        .sq-chart-track {
          height: 32px;
          background: var(--sq-surface-2);
          border: 1px solid var(--sq-border);
          position: relative;
          overflow: hidden;
        }

        .sq-chart-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: sq-bar-grow 1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .sq-chart-inner-val {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
        }

        .sq-chart-ratio {
          font-family: 'Teko', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--sq-text);
          text-align: right;
          letter-spacing: 0.04em;
        }

        /* Science cards grid */
        .sq-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .sq-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .sq-card {
          background: var(--sq-surface);
          border: 1px solid var(--sq-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: sq-fade-up 0.5s ease both;
        }

        .sq-card:nth-child(1) { animation-delay: 0.0s; }
        .sq-card:nth-child(2) { animation-delay: 0.07s; }
        .sq-card:nth-child(3) { animation-delay: 0.14s; }
        .sq-card:nth-child(4) { animation-delay: 0.21s; }

        .sq-card:hover { border-color: var(--sq-border-mid); }

        .sq-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .sq-card.orange::before { background: var(--sq-orange); }
        .sq-card.amber::before { background: var(--sq-amber); }
        .sq-card.orange-amber::before { background: linear-gradient(90deg, var(--sq-orange), var(--sq-amber)); }
        .sq-card.amber-orange::before { background: linear-gradient(90deg, var(--sq-amber), var(--sq-orange)); }

        .sq-card.orange:hover { box-shadow: inset 0 0 80px var(--sq-orange-glow-lg); }
        .sq-card.amber:hover { box-shadow: inset 0 0 80px var(--sq-amber-glow-lg); }
        .sq-card.orange-amber:hover { box-shadow: inset 0 0 80px var(--sq-orange-glow-lg); }
        .sq-card.amber-orange:hover { box-shadow: inset 0 0 80px var(--sq-amber-glow-lg); }

        .sq-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .sq-card.orange .sq-card-glow-orb { background: var(--sq-orange-glow); }
        .sq-card.amber .sq-card-glow-orb { background: var(--sq-amber-glow); }
        .sq-card.orange-amber .sq-card-glow-orb { background: var(--sq-orange-glow); }
        .sq-card.amber-orange .sq-card-glow-orb { background: var(--sq-amber-glow); }

        .sq-card-num {
          font-family: 'Teko', sans-serif;
          font-size: 80px;
          font-weight: 600;
          line-height: 1;
          position: absolute;
          top: 20px; right: 24px;
          opacity: 0.05;
          letter-spacing: 0.02em;
          pointer-events: none;
        }

        .sq-card.orange .sq-card-num { color: var(--sq-orange); }
        .sq-card.amber .sq-card-num { color: var(--sq-amber); }
        .sq-card.orange-amber .sq-card-num { color: var(--sq-orange); }
        .sq-card.amber-orange .sq-card-num { color: var(--sq-amber); }

        .sq-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .sq-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .sq-card.orange .sq-card-icon { background: var(--sq-orange-glow); }
        .sq-card.amber .sq-card-icon { background: var(--sq-amber-glow); }
        .sq-card.orange-amber .sq-card-icon { background: var(--sq-orange-glow); }
        .sq-card.amber-orange .sq-card-icon { background: var(--sq-amber-glow); }

        .sq-card-kicker {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .sq-card.orange .sq-card-kicker { color: var(--sq-orange); }
        .sq-card.amber .sq-card-kicker { color: var(--sq-amber); }
        .sq-card.orange-amber .sq-card-kicker { color: var(--sq-orange); }
        .sq-card.amber-orange .sq-card-kicker { color: var(--sq-amber); }

        .sq-card-title {
          font-family: 'Teko', sans-serif;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--sq-text);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .sq-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sq-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.018);
          border-left: 2px solid var(--sq-border);
          transition: all 0.15s ease;
        }

        .sq-finding:hover {
          background: rgba(255,255,255,0.034);
        }

        .sq-card.orange .sq-finding:hover { border-left-color: rgba(255,107,0,0.5); }
        .sq-card.amber .sq-finding:hover { border-left-color: rgba(255,171,0,0.5); }
        .sq-card.orange-amber .sq-finding:hover { border-left-color: rgba(255,107,0,0.5); }
        .sq-card.amber-orange .sq-finding:hover { border-left-color: rgba(255,171,0,0.5); }

        .sq-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .sq-finding-stat-val {
          font-family: 'Teko', sans-serif;
          font-size: 19px;
          font-weight: 600;
          line-height: 1;
          white-space: nowrap;
          letter-spacing: 0.03em;
        }

        .sq-card.orange .sq-finding-stat-val { color: var(--sq-orange); }
        .sq-card.amber .sq-finding-stat-val { color: var(--sq-amber); }
        .sq-card.orange-amber .sq-finding-stat-val { color: var(--sq-orange); }
        .sq-card.amber-orange .sq-finding-stat-val { color: var(--sq-amber); }

        .sq-finding-ref {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          color: var(--sq-text-dim);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .sq-finding-body { flex: 1; }

        .sq-finding-title {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sq-text);
          margin-bottom: 3px;
        }

        .sq-finding-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: var(--sq-text-dim);
          line-height: 1.55;
        }

        /* Disclaimer */
        .sq-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--sq-surface);
          border: 1px solid var(--sq-border);
          border-left: 3px solid var(--sq-border-mid);
        }

        .sq-disclaimer-text {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          color: var(--sq-text-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .sq-hero { padding: 56px 0 48px; }
          .sq-card { padding: 24px 18px; }
          .sq-chart-wrap { padding: 24px 18px; }
          .sq-hero-h1 { font-size: 54px; }
          .sq-chart-label { font-size: 11px; }
          .sq-hero-court { display: none; }
        }
      `}} />

      <div className="sq-root">
        {/* Header */}
        <header className="sq-header">
          <div className="sq-header-inner">
            <Link href="/workouts" className="sq-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="sq-header-label">Sports Science Series</div>
              <div className="sq-header-title">Squash Science</div>
            </div>
          </div>
        </header>

        <main className="sq-main">
          {/* Hero */}
          <section className="sq-hero">
            {/* Squash court SVG viewed from above */}
            <svg className="sq-hero-court" viewBox="0 0 240 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* Outer walls */}
              <rect x="10" y="10" width="220" height="300" stroke="#ff6b00" strokeWidth="3" fill="none" />
              {/* T-line (horizontal mid divider) */}
              <line x1="10" y1="200" x2="230" y2="200" stroke="#ffab00" strokeWidth="1.5" />
              {/* T-line (vertical centre) */}
              <line x1="120" y1="200" x2="120" y2="310" stroke="#ffab00" strokeWidth="1.5" />
              {/* Front service line */}
              <line x1="10" y1="120" x2="230" y2="120" stroke="#ff6b00" strokeWidth="1" strokeDasharray="6 4" />
              {/* Short service line */}
              <line x1="10" y1="160" x2="230" y2="160" stroke="#ffab00" strokeWidth="1" strokeDasharray="4 4" />
              {/* Tin line */}
              <line x1="10" y1="290" x2="230" y2="290" stroke="#ff6b00" strokeWidth="1.5" />
              {/* Left service box */}
              <rect x="10" y="160" width="110" height="40" stroke="#ffab00" strokeWidth="0.75" fill="none" />
              {/* Right service box */}
              <rect x="120" y="160" width="110" height="40" stroke="#ffab00" strokeWidth="0.75" fill="none" />
              {/* Centre marker */}
              <circle cx="120" cy="160" r="4" stroke="#ff6b00" strokeWidth="1.5" fill="none" />
            </svg>

            <div className="sq-hero-glow" aria-hidden="true" />

            <div className="sq-hero-tag">The Most Demanding Racket Sport</div>

            <h1 className="sq-hero-h1">
              <span>SQUASH</span>
              <span className="accent-orange">POWER</span>
              <span className="accent-outline">&amp; SCIENCE</span>
            </h1>

            <p className="sq-hero-sub">
              Court biomechanics, anticipation science, and elite periodisation behind the world&apos;s most physiologically demanding racket sport. Evidence-based performance research.
            </p>

            <div className="sq-court-dots" aria-hidden="true">
              <div className="sq-court-dot" />
              <div className="sq-court-dot" />
              <div className="sq-court-dot" />
              <div className="sq-court-dot" />
              <div className="sq-court-dot" />
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="sq-section-title">Key Statistics</div>
          <div className="sq-stats-grid">
            <div className="sq-stat-tile c1">
              <div className="sq-stat-num">62–72</div>
              <div className="sq-stat-unit">mL/kg/min</div>
              <div className="sq-stat-label">VO₂max Elite Men</div>
              <div className="sq-stat-ref">Girard 2005</div>
            </div>
            <div className="sq-stat-tile c2">
              <div className="sq-stat-num">3:1</div>
              <div className="sq-stat-unit">work : rest ratio</div>
              <div className="sq-stat-label">Work:Rest Ratio</div>
              <div className="sq-stat-ref">Girard 2007</div>
            </div>
            <div className="sq-stat-tile c3">
              <div className="sq-stat-num">180 km/h</div>
              <div className="sq-stat-unit">elite PSA tour</div>
              <div className="sq-stat-label">Max Drive Speed</div>
              <div className="sq-stat-ref">Phomsoupha 2014</div>
            </div>
            <div className="sq-stat-tile c4">
              <div className="sq-stat-num">50–100</div>
              <div className="sq-stat-unit">per game</div>
              <div className="sq-stat-label">Direction Changes</div>
              <div className="sq-stat-ref">Vuckovic 2013</div>
            </div>
          </div>

          {/* Chart */}
          <div className="sq-section-title">Work:Rest Comparison</div>
          <div className="sq-chart-wrap">
            <div className="sq-chart-title">Work:Rest Ratio Across Racket Sports</div>
            <div className="sq-chart-sub">Higher ratio = greater sustained intensity demand — squash 3:1 is the highest of any racket sport</div>
            <div className="sq-chart-rows">
              {chartData.map((row, i) => (
                <div className="sq-chart-row" key={i}>
                  <div className="sq-chart-label">{row.label}</div>
                  <div className="sq-chart-track">
                    <div
                      className="sq-chart-bar"
                      style={{
                        width: `${row.pct}%`,
                        background: `linear-gradient(90deg, ${row.colorA}33, ${row.colorB}cc)`
                      }}
                    >
                      <span className="sq-chart-inner-val" style={{color: row.colorA}}>{row.ratio}</span>
                    </div>
                  </div>
                  <div className="sq-chart-ratio" style={{color: row.colorA}}>{row.ratio}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="sq-section-title">Research Findings</div>
          <div className="sq-cards-grid">

            {/* Card 1: Physical Demands */}
            <div className="sq-card orange">
              <div className="sq-card-glow-orb" />
              <div className="sq-card-num">01</div>
              <div className="sq-card-top-row">
                <div className="sq-card-icon">🏃</div>
                <div className="sq-card-kicker">Physical Demands</div>
              </div>
              <div className="sq-card-title">Physical Demands — The Most Demanding Racket Sport</div>
              <div className="sq-card-findings">
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">62–72 mL/kg/min</div>
                    <div className="sq-finding-ref">Girard 2005</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">VO₂max — Highest Racket Sport Demand</div>
                    <div className="sq-finding-desc">Squash has the highest physiological demands of any racket sport. VO₂max requirements: 62–72 mL/kg/min for elite men; 55–65 mL/kg/min for elite women. Average HR during match: 86–95% HRmax — sustained higher than tennis, badminton, or table tennis. Rally intensity creates blood lactate 4–8 mmol/L. Work:rest ratio: 2:1 to 3:1 (higher than badminton&apos;s 1:2), making squash uniquely demanding for both aerobic and anaerobic systems simultaneously.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">3–5 km/match</div>
                    <div className="sq-finding-ref">Vuckovic 2013</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">GPS Tracking — Court Coverage</div>
                    <div className="sq-finding-desc">GPS squash analysis: elite players cover 3–5 km per match with 50–100 maximal direction changes per game. Sprint frequency: 30–50 high-intensity efforts per game. Attacking (boast-and-drop) players cover shorter distances at higher sprint intensity; retrieving players cover greater distances at submaximal intensity. Court: 9.75 m × 6.4 m (62.4 m²) — smaller than badminton, forcing more intense multi-directional movement per unit time.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">10–20 s rally</div>
                    <div className="sq-finding-ref">Girard 2007</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Rally Duration &amp; Intermittent Intensity</div>
                    <div className="sq-finding-desc">Typical squash rally: 10–20 s duration; recovery between rallies: 5–10 s; points per game: 9–15 (PAR 11 scoring). The work:rest ratio (2:1 to 3:1) is the highest of any racket sport. Match duration: 35–75 min (best of 5 games). This intermittent high-intensity pattern demands elite O₂ kinetics (fast VO₂ on-kinetics) and lactate clearance capacity — making aerobic power (not just capacity) the key physiological discriminator.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">55% lower body</div>
                    <div className="sq-finding-ref">Jayanthi 2005</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Injury Profile — Knee &amp; Eye Dominant</div>
                    <div className="sq-finding-desc">Squash injury profile dominated by lower extremity injuries (55%): knee (25%), ankle (18%), calf (12%). Extreme lunge depth — the &apos;ghost lunge&apos; to front court: knee flexion 100–130°, requiring quadriceps forces of 4–5× body weight. Patellar tendinopathy: 18–25% of elite players. Racket-eye injuries: 5–8% of injuries; protective eyewear reduces risk 95%. Spinal rotation injuries: 12% — from extreme trunk rotation for side-wall shots.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Biomechanics */}
            <div className="sq-card amber">
              <div className="sq-card-glow-orb" />
              <div className="sq-card-num">02</div>
              <div className="sq-card-top-row">
                <div className="sq-card-icon">⚡</div>
                <div className="sq-card-kicker">Biomechanics &amp; Technique</div>
              </div>
              <div className="sq-card-title">Biomechanics &amp; Technique</div>
              <div className="sq-card-findings">
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">140–180 km/h</div>
                    <div className="sq-finding-ref">Phomsoupha 2014</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Forehand Drive — Ball Speed</div>
                    <div className="sq-finding-desc">Squash forehand drive generates ball speeds of 140–180 km/h (elite PSA tour); backhand drive: 110–150 km/h. Racket head speed at impact: 30–40 m/s. Kinetic chain: hip rotation → trunk rotation → shoulder adduction → elbow extension → wrist snap. Racket face angle: 5° variation changes ball trajectory 2–3 m at far wall — requiring millimetre-precision motor control under fatigue.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">&lt;40 km/h</div>
                    <div className="sq-finding-ref">PSA Technical</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Drop Shot — Nick Targeting</div>
                    <div className="sq-finding-desc">The &apos;nick&apos; (ball landing in the corner junction of wall and floor) is the highest-value shot in squash. Achieving the nick requires: sub-40 km/h contact speed, hitting within 15 cm of the side-wall, at 0–5 cm above floor level. Technique: open racket face with minimal wrist snap, disguised until final 50 ms. Elite PSA players achieve nicks on 8–15% of front-court attempts. The deceptive preparation (same swing path for drop and drive) is the most trained technical skill distinguishing elite from sub-elite.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">400–600 touches</div>
                    <div className="sq-finding-ref">Vuckovic 2010</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Ghosting — Court Touch Volume</div>
                    <div className="sq-finding-desc">&apos;Ghosting&apos; (movement training without ball) to all 4 court corners is the primary squash-specific conditioning tool. A 20-minute ghosting session includes 400–600 court touch events. Resistance ghosting (weighted vest, parachute) increases stimulus. 8-week ghosting programme improved court coverage speed 12%, reduced energy expenditure per court touch 8% — meaning improved movement efficiency at match intensity.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">+18% consistency</div>
                    <div className="sq-finding-ref">Tod 2018</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Swing Path — Inside-Out Mechanics</div>
                    <div className="sq-finding-desc">Optimal squash swing mechanics combine an inside-out (anterior to posterior) swing path with hitting point contact at hip height for maximum force transfer and directional control. Unlike tennis, squash players must contact the ball at varying heights — forehand contact ranges from knee height (boasts, drops) to shoulder height (high cross-courts), requiring 3–4 technically distinct swing variants. Proprioceptive feedback training improves contact consistency 18% in controlled studies.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Mental Performance */}
            <div className="sq-card orange-amber">
              <div className="sq-card-glow-orb" />
              <div className="sq-card-num">03</div>
              <div className="sq-card-top-row">
                <div className="sq-card-icon">🧠</div>
                <div className="sq-card-kicker">Mental Performance</div>
              </div>
              <div className="sq-card-title">Mental Performance &amp; Tactical Intelligence</div>
              <div className="sq-card-findings">
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">200 ms early</div>
                    <div className="sq-finding-ref">Murray 2013</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Anticipation — Pre-Contact Movement</div>
                    <div className="sq-finding-desc">Elite squash players commit to movement direction 200–250 ms before opponent racket-ball contact — relying entirely on predictive cues (hip rotation angle, shoulder position, racket trajectory). Novice players begin movement &lt;50 ms after contact. This 200 ms advantage is trainable: video-based anticipation training (watching match footage with occlusion) improved movement initiation timing 60–80 ms in 6-week intervention. Domain-specific anticipation — not transferable from tennis or other racket sports.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">70% tactical</div>
                    <div className="sq-finding-ref">Pearson 2017</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Error Analysis — Shot Choice Dominates</div>
                    <div className="sq-finding-desc">Analysis of unforced errors in professional squash reveals 70% are attributable to tactical decision errors (wrong shot choice for court position) rather than technical execution failures. Elite players execute &gt;95% of technically attempted shots successfully; the performance gap between top-50 and top-5 players is primarily tactical. Implication: advanced coaching prioritises scenario-based decision training over technical drilling.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">85–92% HRmax</div>
                    <div className="sq-finding-ref">PSA Academies</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Pressure Training — Cognitive Load Match</div>
                    <div className="sq-finding-desc">Ghost training at 85–92% HRmax creates a cognitive load environment similar to competitive play — motor programme selection under cardiovascular stress. High-intensity ghosting combined with shot-calling (coach announces shot type mid-lunge) is the gold standard for bridging physical training and decision-making integration. This methodology, borrowed from military cognitive performance research, is used in PSA training academies.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">+8–12% game 1</div>
                    <div className="sq-finding-ref">Hornery 2009</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Pre-Match Routine — Warm-Up Optimisation</div>
                    <div className="sq-finding-desc">Standardised pre-match warm-up (15–20 min: 5 min solo ball-feeding, 5 min cooperative rallying, 5 min conditioned game) improves first-game performance 8–12% compared to cold starts. The 5-minute ball-hitting period required by PSA rules is physiologically insufficient for VO₂ on-kinetics priming. Temperature priming: wearing thermal top during warm-up maintains muscle temperature through the required on-court warm-up period.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Training Science */}
            <div className="sq-card amber-orange">
              <div className="sq-card-glow-orb" />
              <div className="sq-card-num">04</div>
              <div className="sq-card-top-row">
                <div className="sq-card-icon">📊</div>
                <div className="sq-card-kicker">Training Science</div>
              </div>
              <div className="sq-card-title">Training Science &amp; Periodisation</div>
              <div className="sq-card-findings">
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">3–4 court + 2–3 S&amp;C</div>
                    <div className="sq-finding-ref">Girard 2012</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Elite Weekly Training Structure</div>
                    <div className="sq-finding-desc">Professional squash players average 3–4 on-court sessions (90–120 min) plus 2–3 off-court conditioning sessions (60–75 min) per week during competition phase. Annual periodisation: pre-season (12 weeks) 60% fitness emphasis; competition phase (8 months) 70% on-court tactical/technical emphasis; transition (4 weeks) active recovery. PSA tour demands: 15–25 competitive matches per month at peak schedule requires careful training-to-competition ratio management.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">30:30 s HIIT</div>
                    <div className="sq-finding-ref">Heishman 2016</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Squash-Specific HIIT Protocol</div>
                    <div className="sq-finding-desc">Squash-specific HIIT: 30 s maximal ghosting effort → 30 s active recovery × 20 repetitions. Physiological response: 88–94% HRmax during work intervals; 70–78% during recovery. 8-week intervention: VO₂max improved 6–9%; time to exhaustion improved 18%; first-game match performance improved 14% (vs. steady-state training control). The 30:30 ratio closely matches typical squash rally:rest structure, providing sport-specific physiological adaptation stimulus.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">2 sessions/week</div>
                    <div className="sq-finding-ref">Lees 2010</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Strength — Posterior Chain Priority</div>
                    <div className="sq-finding-desc">Squash-specific S&amp;C: single-leg squat depth (lunge equivalent), hip external rotation, and posterior shoulder strength are the three strongest predictors of on-court performance. Recommended programme: split squat progression (0–90° knee flexion), lateral band walks, Romanian deadlift, face pulls, and anti-rotation core. Weekly resistance: 2 sessions maintaining primary adaptations; &gt;3 sessions risks residual fatigue impairing court performance. Periodise intensity inverse to competition frequency.</div>
                  </div>
                </div>
                <div className="sq-finding">
                  <div className="sq-finding-stat">
                    <div className="sq-finding-stat-val">24–48 h recovery</div>
                    <div className="sq-finding-ref">Bottoms 2006</div>
                  </div>
                  <div className="sq-finding-body">
                    <div className="sq-finding-title">Neuromuscular Recovery Timeline</div>
                    <div className="sq-finding-desc">Squash match play produces significant neuromuscular fatigue — CMJ height decreased 8–12% immediately post-match; recovery to baseline requires 24–48 hours. CK elevation 2.5–3× baseline at 24 hours (muscle damage marker). Match-day recovery: 10 min cool-down ghosting at 60% intensity; ice bath (12°C, 10 min) reduces CK elevation 15%; compression garments reduce perceived soreness 20%. Tournament recovery (3+ matches/day): prioritise carbohydrate replenishment (1.2 g/kg/hour first 4 hours) and sleep duration.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="sq-disclaimer">
            <div className="sq-disclaimer-text">
              DISCLAIMER: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies including the PSA World Tour and World Squash Federation. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing players. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
