import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Archery Science | KQuarks' }

export default function ArcherySciencePage() {
  const chartData = [
    { label: 'Compound (50m)', value: 300, pct: 100, color: '#c9a84c' },
    { label: 'Olympic Record', value: 240, pct: 80, color: '#e0c87a' },
    { label: 'Recurve (70m)', value: 220, pct: 73, color: '#a87d2e' },
    { label: 'Field Archery', value: 210, pct: 70, color: '#8a6520' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;900&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        :root {
          --arc-forest: #1a3a20;
          --arc-gold: #c9a84c;
          --arc-cream: #f5f0e8;
          --arc-dark: #0d1a10;
          --arc-surface: #122118;
          --arc-surface-2: #172b1e;
          --arc-border: #243d28;
          --arc-border-mid: #2e5035;
          --arc-gold-dim: #8a6520;
          --arc-gold-glow: rgba(201, 168, 76, 0.12);
          --arc-gold-glow-lg: rgba(201, 168, 76, 0.06);
          --arc-green-glow: rgba(26, 58, 32, 0.5);
          --arc-cream-dim: #9a9080;
          --arc-cream-faint: #2e3a2a;
          --arc-amber: #e0a840;
          --arc-amber-dim: #7a5a1a;
          --arc-amber-glow: rgba(224, 168, 64, 0.12);
          --arc-sage: #7ab87a;
          --arc-sage-dim: #3a6e3a;
          --arc-sage-glow: rgba(122, 184, 122, 0.12);
          --arc-rust: #b86040;
          --arc-rust-dim: #7a3820;
          --arc-rust-glow: rgba(184, 96, 64, 0.12);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .arc-root {
          min-height: 100vh;
          background-color: var(--arc-dark);
          color: var(--arc-cream);
          font-family: 'EB Garamond', serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Parchment grain overlay */
        .arc-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Forest canopy ambient glow */
        .arc-root::after {
          content: '';
          position: fixed;
          top: -40vh;
          left: 50%;
          transform: translateX(-50%);
          width: 200vw;
          height: 70vh;
          background: radial-gradient(ellipse at top, rgba(26, 58, 32, 0.18) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .arc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(13, 26, 16, 0.95);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--arc-border);
        }

        .arc-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .arc-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          color: var(--arc-cream-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .arc-back-btn:hover {
          background: var(--arc-surface-2);
          border-color: var(--arc-gold-dim);
          color: var(--arc-gold);
        }

        .arc-header-label {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--arc-gold-dim);
        }

        .arc-header-title {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--arc-cream);
          text-transform: uppercase;
        }

        /* Main */
        .arc-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .arc-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: arc-fade-up 0.6s ease both;
        }

        @keyframes arc-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes arc-glow-pulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }

        @keyframes arc-bar-grow {
          from { width: 0; }
        }

        @keyframes arc-draw {
          from { stroke-dashoffset: 900; }
          to { stroke-dashoffset: 0; }
        }

        /* Target ring lines in hero bg */
        .arc-hero-rings {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .arc-hero-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid var(--arc-gold);
          opacity: 0.04;
          top: 50%;
          right: -20%;
          transform: translateY(-50%);
        }

        /* Gold glow blob */
        .arc-hero-glow {
          position: absolute;
          top: -60px;
          right: -80px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201, 168, 76, 0.07) 0%, transparent 70%);
          pointer-events: none;
          animation: arc-glow-pulse 5s ease-in-out infinite;
        }

        .arc-hero-tag {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--arc-gold);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .arc-hero-tag::before {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--arc-gold));
        }

        .arc-hero-h1 {
          font-family: 'Cinzel', serif;
          font-size: clamp(52px, 9.5vw, 112px);
          line-height: 0.88;
          letter-spacing: 0.04em;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--arc-cream);
          margin-bottom: 10px;
        }

        .arc-hero-h1 .accent-gold {
          color: var(--arc-gold);
          display: block;
          text-shadow: 0 0 60px rgba(201, 168, 76, 0.3);
        }

        .arc-hero-h1 .accent-outline {
          -webkit-text-stroke: 1px var(--arc-gold-dim);
          color: transparent;
          display: block;
        }

        .arc-hero-sub {
          font-family: 'EB Garamond', serif;
          font-size: clamp(16px, 2.2vw, 21px);
          font-weight: 400;
          font-style: italic;
          letter-spacing: 0.03em;
          color: var(--arc-cream-dim);
          margin-top: 24px;
          max-width: 640px;
          line-height: 1.5;
        }

        /* Decorative arrow trajectory viz */
        .arc-hero-traj {
          display: flex;
          align-items: center;
          gap: 0;
          height: 24px;
          margin: 24px 0;
          opacity: 0.5;
        }

        .arc-traj-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--arc-gold) 40%, var(--arc-gold-dim) 70%, transparent);
          animation: arc-glow-pulse 3s ease-in-out infinite;
        }

        .arc-traj-arrowhead {
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 10px solid var(--arc-gold-dim);
        }

        /* Key stats grid */
        .arc-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: arc-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .arc-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .arc-stat-tile {
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .arc-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .arc-stat-tile.c1::before { background: var(--arc-gold); }
        .arc-stat-tile.c2::before { background: var(--arc-amber); }
        .arc-stat-tile.c3::before { background: var(--arc-sage); }
        .arc-stat-tile.c4::before { background: var(--arc-rust); }

        .arc-stat-tile:hover {
          border-color: var(--arc-border-mid);
        }

        .arc-stat-num {
          font-family: 'Cinzel', serif;
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          color: var(--arc-cream);
        }

        .arc-stat-tile.c1 .arc-stat-num { color: var(--arc-gold); }
        .arc-stat-tile.c2 .arc-stat-num { color: var(--arc-amber); }
        .arc-stat-tile.c3 .arc-stat-num { color: var(--arc-sage); }
        .arc-stat-tile.c4 .arc-stat-num { color: var(--arc-rust); }

        .arc-stat-unit {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          color: var(--arc-cream-dim);
          margin-top: 3px;
          letter-spacing: 0.12em;
        }

        .arc-stat-label {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--arc-cream-dim);
          margin-top: 8px;
        }

        .arc-stat-ref {
          font-family: 'EB Garamond', serif;
          font-size: 10px;
          font-style: italic;
          color: var(--arc-cream-faint);
          margin-top: 5px;
          letter-spacing: 0.03em;
        }

        /* Section label */
        .arc-section-title {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--arc-cream-dim);
          margin: 48px 0 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .arc-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--arc-border);
        }

        /* Chart section */
        .arc-chart-wrap {
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: arc-fade-up 0.5s ease 0.15s both;
        }

        .arc-chart-title {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--arc-cream);
          margin-bottom: 6px;
        }

        .arc-chart-sub {
          font-family: 'EB Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: var(--arc-cream-dim);
          margin-bottom: 28px;
        }

        .arc-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .arc-chart-row {
          display: grid;
          grid-template-columns: 180px 1fr 72px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .arc-chart-row {
            grid-template-columns: 120px 1fr 52px;
            gap: 8px;
          }
        }

        .arc-chart-label {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--arc-cream-dim);
          text-align: right;
        }

        .arc-chart-track {
          height: 30px;
          background: var(--arc-surface-2);
          border: 1px solid var(--arc-border);
          position: relative;
          overflow: hidden;
        }

        .arc-chart-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: arc-bar-grow 1.1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .arc-chart-val {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }

        .arc-chart-fps {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--arc-cream);
          text-align: right;
        }

        .arc-chart-fps-unit {
          font-family: 'EB Garamond', serif;
          font-size: 10px;
          color: var(--arc-cream-dim);
          margin-left: 2px;
        }

        /* Science cards grid */
        .arc-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .arc-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .arc-card {
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: arc-fade-up 0.5s ease both;
        }

        .arc-card:nth-child(1) { animation-delay: 0.0s; }
        .arc-card:nth-child(2) { animation-delay: 0.07s; }
        .arc-card:nth-child(3) { animation-delay: 0.14s; }
        .arc-card:nth-child(4) { animation-delay: 0.21s; }

        .arc-card:hover { border-color: var(--arc-border-mid); }

        .arc-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .arc-card.gold::before { background: var(--arc-gold); }
        .arc-card.amber::before { background: var(--arc-amber); }
        .arc-card.sage::before { background: var(--arc-sage); }
        .arc-card.rust::before { background: var(--arc-rust); }

        .arc-card.gold:hover { box-shadow: inset 0 0 80px var(--arc-gold-glow-lg); }
        .arc-card.amber:hover { box-shadow: inset 0 0 80px var(--arc-amber-glow); }
        .arc-card.sage:hover { box-shadow: inset 0 0 80px var(--arc-sage-glow); }
        .arc-card.rust:hover { box-shadow: inset 0 0 80px var(--arc-rust-glow); }

        .arc-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 200px; height: 200px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .arc-card.gold .arc-card-glow-orb { background: var(--arc-gold-glow); }
        .arc-card.amber .arc-card-glow-orb { background: var(--arc-amber-glow); }
        .arc-card.sage .arc-card-glow-orb { background: var(--arc-sage-glow); }
        .arc-card.rust .arc-card-glow-orb { background: var(--arc-rust-glow); }

        .arc-card-num {
          font-family: 'Cinzel Decorative', serif;
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 20px; right: 24px;
          opacity: 0.05;
          letter-spacing: -0.02em;
          pointer-events: none;
        }

        .arc-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .arc-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .arc-card.gold .arc-card-icon { background: var(--arc-gold-glow); }
        .arc-card.amber .arc-card-icon { background: var(--arc-amber-glow); }
        .arc-card.sage .arc-card-icon { background: var(--arc-sage-glow); }
        .arc-card.rust .arc-card-icon { background: var(--arc-rust-glow); }

        .arc-card-kicker {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .arc-card.gold .arc-card-kicker { color: var(--arc-gold); }
        .arc-card.amber .arc-card-kicker { color: var(--arc-amber); }
        .arc-card.sage .arc-card-kicker { color: var(--arc-sage); }
        .arc-card.rust .arc-card-kicker { color: var(--arc-rust); }

        .arc-card-title {
          font-family: 'Cinzel', serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--arc-cream);
          line-height: 1.15;
          margin-bottom: 20px;
        }

        .arc-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .arc-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.018);
          border-left: 2px solid var(--arc-border);
          transition: all 0.15s ease;
        }

        .arc-finding:hover {
          background: rgba(255,255,255,0.032);
        }

        .arc-card.gold .arc-finding:hover { border-left-color: var(--arc-gold-dim); }
        .arc-card.amber .arc-finding:hover { border-left-color: var(--arc-amber-dim); }
        .arc-card.sage .arc-finding:hover { border-left-color: var(--arc-sage-dim); }
        .arc-card.rust .arc-finding:hover { border-left-color: var(--arc-rust-dim); }

        .arc-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .arc-finding-stat-val {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .arc-card.gold .arc-finding-stat-val { color: var(--arc-gold); }
        .arc-card.amber .arc-finding-stat-val { color: var(--arc-amber); }
        .arc-card.sage .arc-finding-stat-val { color: var(--arc-sage); }
        .arc-card.rust .arc-finding-stat-val { color: var(--arc-rust); }

        .arc-finding-ref {
          font-family: 'EB Garamond', serif;
          font-size: 10px;
          font-style: italic;
          color: var(--arc-cream-dim);
          margin-top: 3px;
          letter-spacing: 0.02em;
        }

        .arc-finding-body { flex: 1; }

        .arc-finding-title {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--arc-cream);
          margin-bottom: 4px;
        }

        .arc-finding-desc {
          font-family: 'EB Garamond', serif;
          font-size: 13.5px;
          font-weight: 400;
          color: var(--arc-cream-dim);
          line-height: 1.5;
        }

        /* Disclaimer */
        .arc-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--arc-surface);
          border: 1px solid var(--arc-border);
          border-left: 3px solid var(--arc-border-mid);
        }

        .arc-disclaimer-text {
          font-family: 'EB Garamond', serif;
          font-size: 11px;
          font-style: italic;
          color: var(--arc-cream-dim);
          line-height: 1.75;
          letter-spacing: 0.03em;
        }

        @media (max-width: 768px) {
          .arc-hero { padding: 56px 0 48px; }
          .arc-card { padding: 24px 18px; }
          .arc-chart-wrap { padding: 24px 18px; }
          .arc-hero-h1 { font-size: 50px; }
          .arc-chart-label { font-size: 10px; }
        }
      `}} />

      <div className="arc-root">
        {/* Header */}
        <header className="arc-header">
          <div className="arc-header-inner">
            <Link href="/workouts" className="arc-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="arc-header-label">Sports Science Series</div>
              <div className="arc-header-title">Archery Science</div>
            </div>
          </div>
        </header>

        <main className="arc-main">
          {/* Hero */}
          <section className="arc-hero">
            <div className="arc-hero-rings" aria-hidden="true">
              <div className="arc-hero-ring" style={{width: '600px', height: '600px', marginRight: '-300px', marginTop: '-300px'}} />
              <div className="arc-hero-ring" style={{width: '420px', height: '420px', marginRight: '-210px', marginTop: '-210px'}} />
              <div className="arc-hero-ring" style={{width: '260px', height: '260px', marginRight: '-130px', marginTop: '-130px'}} />
              <div className="arc-hero-ring" style={{width: '140px', height: '140px', marginRight: '-70px', marginTop: '-70px', opacity: 0.08}} />
            </div>
            <div className="arc-hero-glow" aria-hidden="true" />

            <div className="arc-hero-tag">Precision Ballistics &amp; Sport Psychology</div>

            <h1 className="arc-hero-h1">
              <span>ARCHERY</span>
              <span className="accent-gold">PRECISION</span>
              <span className="accent-outline">&amp; SCIENCE</span>
            </h1>

            <p className="arc-hero-sub">
              The biomechanics, neuroscience, and equipment physics behind the world&apos;s oldest precision sport — from arrow paradox to cardiac diastole timing.
            </p>

            <div className="arc-hero-traj" aria-hidden="true">
              <div className="arc-traj-line" />
              <div className="arc-traj-arrowhead" />
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="arc-section-title">Key Statistics</div>
          <div className="arc-stats-grid">
            <div className="arc-stat-tile c1">
              <div className="arc-stat-num">12.4 cm</div>
              <div className="arc-stat-unit">diameter</div>
              <div className="arc-stat-label">Olympic 10-Ring at 70 m</div>
              <div className="arc-stat-ref">World Archery Regulations</div>
            </div>
            <div className="arc-stat-tile c2">
              <div className="arc-stat-num">0.7 s</div>
              <div className="arc-stat-unit">fixation</div>
              <div className="arc-stat-label">Quiet Eye Duration — Elite</div>
              <div className="arc-stat-ref">Vickers 2007</div>
            </div>
            <div className="arc-stat-tile c3">
              <div className="arc-stat-num">93%</div>
              <div className="arc-stat-unit">let-off</div>
              <div className="arc-stat-label">Compound Bow Peak Reduction</div>
              <div className="arc-stat-ref">WA Equipment Spec</div>
            </div>
            <div className="arc-stat-tile c4">
              <div className="arc-stat-num">±2 mm</div>
              <div className="arc-stat-unit">grouping</div>
              <div className="arc-stat-label">Elite Compound Group at 50 m</div>
              <div className="arc-stat-ref">World Archery</div>
            </div>
          </div>

          {/* Chart */}
          <div className="arc-section-title">Velocity Comparison</div>
          <div className="arc-chart-wrap">
            <div className="arc-chart-title">Arrow Velocity Comparison</div>
            <div className="arc-chart-sub">Arrow speed at launch across archery disciplines — feet per second (fps)</div>
            <div className="arc-chart-rows">
              {chartData.map((row, i) => (
                <div className="arc-chart-row" key={i}>
                  <div className="arc-chart-label">{row.label}</div>
                  <div className="arc-chart-track">
                    <div
                      className="arc-chart-bar"
                      style={{width: `${row.pct}%`, background: `linear-gradient(90deg, ${row.color}22, ${row.color}88)`}}
                    >
                      <span className="arc-chart-val" style={{color: row.color}}>{row.pct}%</span>
                    </div>
                  </div>
                  <div className="arc-chart-fps" style={{color: row.color}}>
                    {row.value}<span className="arc-chart-fps-unit">fps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="arc-section-title">Research Findings</div>
          <div className="arc-cards-grid">

            {/* Card 1: Precision Biomechanics */}
            <div className="arc-card gold">
              <div className="arc-card-glow-orb" />
              <div className="arc-card-num">01</div>
              <div className="arc-card-top-row">
                <div className="arc-card-icon">🎯</div>
                <div className="arc-card-kicker">Biomechanics</div>
              </div>
              <div className="arc-card-title">Precision Biomechanics &amp; Shot Execution</div>
              <div className="arc-card-findings">
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">12.4 cm</div>
                    <div className="arc-finding-ref">World Archery Regs</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Olympic 10-Ring at 70 m</div>
                    <div className="arc-finding-desc">World Archery regulations: Olympic recurve target at 70 m has a 10-ring (gold) diameter of 12.4 cm, subtending a visual angle of 0.10°. Elite archers achieve 30/36 scores (10+9 rings) in 72-arrow rounds — a mean grouping of &lt;4 cm at 70 m. Arrow flight time: 350–400 ms for a 240-grain arrow at 200+ fps. Physical tremor in the aiming bow arm averages 2–4 mm lateral movement in elite archers — managed by trained muscular co-contraction and timing of the clicker.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">20–25 kg</div>
                    <div className="arc-finding-ref">Leroyer 1993</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Back Tension Draw Force</div>
                    <div className="arc-finding-desc">Leroyer 1993 (Olympic archery biomechanics): recurve bow draw weight for elite: 18–24 kg (40–53 lbs) at 28–30 inch draw length. Primary muscles: scapular retractors (rhomboids, middle trapezius, serratus posterior): 70% of draw force; rotator cuff external rotators (infraspinatus, teres minor): 20%; biceps brachii: 10%. Muscle activation maintained isometrically for 2–4 seconds between full draw and clicker-triggered release.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">0.4 s</div>
                    <div className="arc-finding-ref">Sillero 2014</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Cardiac Diastole Release Timing</div>
                    <div className="arc-finding-desc">Sillero 2014: elite archers develop the ability to time arrow release during cardiac diastole — the 0.4 s phase when heart muscle relaxation minimises transmitted cardiovascular tremor to the bow arm. This reduces shot-to-shot grouping scatter 8–12% compared to random release timing. Resting HR for elite archers: 48–58 bpm. Pre-shot HR increase at competition: 15–25 bpm above resting.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">10–20 mm</div>
                    <div className="arc-finding-ref">Kooi 1994</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Archer&apos;s Paradox — Arrow Flex</div>
                    <div className="arc-finding-desc">Kooi 1994: at release, stored bow energy is transferred to the arrow in &lt;2 ms, generating peak arrow acceleration of ~1,500 m/s². The arrow&apos;s shaft temporarily flexes laterally 10–20 mm (the &apos;archer&apos;s paradox&apos;) as it passes the bow&apos;s riser, then oscillates longitudinally 3–5 times before stabilising. Arrow spine (stiffness) must match bow draw weight precisely — too stiff: arrow kicks left; too flexible: arrow kicks right.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Mental Performance */}
            <div className="arc-card amber">
              <div className="arc-card-glow-orb" />
              <div className="arc-card-num">02</div>
              <div className="arc-card-top-row">
                <div className="arc-card-icon">🧠</div>
                <div className="arc-card-kicker">Neuroscience</div>
              </div>
              <div className="arc-card-title">Mental Performance &amp; Focus Science</div>
              <div className="arc-card-findings">
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">0.7–1.2 s</div>
                    <div className="arc-finding-ref">Vickers 2007</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Quiet Eye Pre-Shot Fixation</div>
                    <div className="arc-finding-desc">Vickers 2007 (quiet eye in precision sports): elite archers maintain a stable final aiming fixation (quiet eye) of 0.7–1.2 s on the gold before release, vs. 0.3–0.5 s in intermediate archers. Longer quiet eye predicts score accuracy (r=0.68). Quiet eye duration is trainable: 6-week QE training improved elite archer scores 4–6%.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">+18–22%</div>
                    <div className="arc-finding-ref">Landers 1994</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Alpha Wave Increase Pre-Release</div>
                    <div className="arc-finding-desc">Landers 1994 (EEG in Olympic archery): alpha wave power in left temporal cortex increases 18–22% in the final 3 seconds before release in expert archers — reflecting motor quietude and suppression of verbal-analytical processing. Novice archers show decreased alpha (increased cortical activation = overthinking). Mindfulness-based archery coaching targets this neural state.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">&gt;20 bpm</div>
                    <div className="arc-finding-ref">Beilock 2010</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Choking Under Pressure</div>
                    <div className="arc-finding-desc">Beilock 2010 (applied to precision sports): performance breakdown under competition pressure in archery correlates with HR elevation &gt;20 bpm above practice baseline. Choking mechanism: redirected attentional resources to explicit monitoring of normally automatic motor sequences. Intervention: pressure training reduces performance-anxiety HR elevation 30–40% over 8 weeks.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">1–2 s</div>
                    <div className="arc-finding-ref">Nishizono 1987</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Respiratory Pause — Optimal Release</div>
                    <div className="arc-finding-desc">Nishizono 1987: optimal arrow release timing within the respiratory cycle is during the natural pause between exhalation and inhalation — a 1–2 s window of lowest respiratory-transmitted tremor. Elite archers hold breath during final aim and release in this post-expiratory pause. This reduces vertical bow-arm tremor amplitude 30–45% vs. mid-inhalation release.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Compound vs Recurve */}
            <div className="arc-card sage">
              <div className="arc-card-glow-orb" />
              <div className="arc-card-num">03</div>
              <div className="arc-card-top-row">
                <div className="arc-card-icon">🏹</div>
                <div className="arc-card-kicker">Disciplines</div>
              </div>
              <div className="arc-card-title">Compound vs Recurve Physiology</div>
              <div className="arc-card-findings">
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">90% let-off</div>
                    <div className="arc-finding-ref">WA Equipment Spec</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Compound Cam Let-Off System</div>
                    <div className="arc-finding-desc">Compound bow physics: cam system provides 65–90% let-off, meaning a 30 kg peak draw weight requires only 3–9 kg holding force at full draw vs. 30 kg continuously in recurve. This reduces muscular fatigue 75–80% during the aiming phase. Physical requirement shifts from muscular endurance to postural stability and trigger control.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">&lt;2 mm</div>
                    <div className="arc-finding-ref">World Archery</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Compound Precision at 50 m</div>
                    <div className="arc-finding-desc">World Archery compound specifications: peep sight diameter 0.5–4 mm; target face 6 cm 10-ring at 50 m (vs. 12.4 cm at 70 m for recurve). Combined with mechanical release aid, elite compound archers achieve groups of &lt;2 cm at 50 m. Compound archery physiology: 40% lower physical demand than recurve; mental performance is the dominant discriminator.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">3–5 km</div>
                    <div className="arc-finding-ref">WA Field Rules</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Field Archery Cardiovascular Load</div>
                    <div className="arc-finding-desc">Field archery courses: archers hike 3–5 km across varied terrain between targets at unknown distances (10–60 m). Cardiovascular demand: HR 65–80% HRmax during inter-target movement. VO₂max 45–55 mL/kg/min adequate for field archery. Field archers with VO₂max &gt;50 mL/kg/min recover sufficiently (HR &lt;70% HRmax) within 60–90 s of arrival at the target peg.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">W1 / W2</div>
                    <div className="arc-finding-ref">WA Para Class</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Para-Archery Adaptive Classifications</div>
                    <div className="arc-finding-desc">World Archery Para classification: Standing (minimal disability), W1 (wheelchair, upper and lower limb), W2 (wheelchair, lower limb only). W1 archers use mouth tabs or chin support for draw. Physical screening: grip strength, shoulder ER strength, and trunk stability evaluated in classification. Adaptive equipment: bow support frames, sight adjusters, and custom releases.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Equipment Physics */}
            <div className="arc-card rust">
              <div className="arc-card-glow-orb" />
              <div className="arc-card-num">04</div>
              <div className="arc-card-top-row">
                <div className="arc-card-icon">⚙️</div>
                <div className="arc-card-kicker">Equipment Physics</div>
              </div>
              <div className="arc-card-title">Equipment Physics &amp; Arrow Ballistics</div>
              <div className="arc-card-findings">
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">200–320 fps</div>
                    <div className="arc-finding-ref">WA Equipment Regs</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Arrow Velocity by Discipline</div>
                    <div className="arc-finding-desc">WA equipment regulations: recurve arrow speed: 200–240 fps (60–73 m/s) at 70 m; compound: 280–320 fps (85–97 m/s) at 50 m. Kinetic energy at target: recurve ~10 J; compound ~25 J. Arrow drop over 70 m for recurve: 1.8–2.4 m below line of sight — requiring 2–3° of sight elevation. Wind correction: 1.5–2.5 cm per km/h crosswind for recurve.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">50–150 Hz</div>
                    <div className="arc-finding-ref">Lienhard 2018</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">String Vibration &amp; Dampening</div>
                    <div className="arc-finding-desc">Lienhard 2018 (vibration analysis): bow string vibration post-release generates 50–150 Hz mechanical oscillation. Without dampening: grip vibration amplitude 3–5 mm; with dampeners: reduced to &lt;1 mm. Counter-intuitively, the arrow has left the bow within 15 ms of release, before vibration effects accumulate. Dampeners primarily reduce noise and &apos;hand shock&apos; rather than accuracy.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">6× scope</div>
                    <div className="arc-finding-ref">WA Rules</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Sight Magnification Rules</div>
                    <div className="arc-finding-desc">Olympic recurve rules prohibit optical magnification. Compound can use up to 6× magnification scope. Effect on precision: compound scopes enable consistent sight picture, reducing aim point scatter 40–50%. This contributes to compound scoring 5–8% higher than recurve at equivalent distances.</div>
                  </div>
                </div>
                <div className="arc-finding">
                  <div className="arc-finding-stat">
                    <div className="arc-finding-stat-val">1,500 m/s²</div>
                    <div className="arc-finding-ref">Kooi 1994</div>
                  </div>
                  <div className="arc-finding-body">
                    <div className="arc-finding-title">Peak Arrow Acceleration at Release</div>
                    <div className="arc-finding-desc">At release, stored bow limb energy is transferred to the arrow in under 2 ms, generating peak arrow acceleration of ~1,500 m/s² — approximately 150 g-force. The arrow&apos;s dynamic spine value must be matched within ±5 lb-inches of the bow draw weight to achieve consistent paradox clearance of the riser and reproducible downrange trajectory. Mismatched spine is responsible for 40–60% of unexplained flyers in recreational archery.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="arc-disclaimer">
            <div className="arc-disclaimer-text">
              Disclaimer: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies including World Archery. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing archers. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
