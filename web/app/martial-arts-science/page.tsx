import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Martial Arts Science' }

export default function MartialArtsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --dojo-black: #0a0707;
          --dojo-dark: #100c0b;
          --dojo-surface: #160e0d;
          --dojo-surface-2: #1c1210;
          --dojo-border: #2d1f1c;
          --crimson: #dc2626;
          --crimson-bright: #ef4444;
          --crimson-dim: #991b1b;
          --crimson-glow: rgba(220, 38, 38, 0.14);
          --ember: #ea580c;
          --ember-bright: #f97316;
          --ember-glow: rgba(234, 88, 12, 0.12);
          --dojo-gold: #ca8a04;
          --dojo-gold-bright: #eab308;
          --dojo-gold-dim: #713f12;
          --dojo-gold-glow: rgba(202, 138, 4, 0.12);
          --dojo-green: #16a34a;
          --dojo-green-bright: #22c55e;
          --dojo-green-glow: rgba(22, 163, 74, 0.12);
          --parchment: #f0e6d8;
          --parchment-dim: #9c8470;
          --parchment-faint: #3a2820;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ma-root {
          min-height: 100vh;
          background-color: var(--dojo-black);
          color: var(--parchment);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .ma-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Dojo background geometry */
        .ma-root::after {
          content: '';
          position: fixed;
          bottom: -20vh;
          right: -15vw;
          width: 70vw;
          height: 70vw;
          border-radius: 50%;
          border: 1px solid var(--parchment-faint);
          pointer-events: none;
          z-index: 0;
          opacity: 0.15;
        }

        /* Header */
        .ma-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 7, 7, 0.93);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--dojo-border);
        }

        .ma-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ma-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          background: var(--dojo-surface);
          border: 1px solid var(--dojo-border);
          color: var(--parchment-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .ma-back-btn:hover {
          background: var(--dojo-surface-2);
          border-color: var(--parchment-faint);
          color: var(--parchment);
        }

        .ma-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--crimson);
        }

        .ma-header-title {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--parchment);
        }

        /* Main */
        .ma-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .ma-hero {
          position: relative;
          padding: 80px 0 60px;
          overflow: hidden;
          animation: ma-fade-up 0.6s ease both;
        }

        .ma-hero-embers {
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: radial-gradient(ellipse at top right, rgba(220,38,38,0.12) 0%, rgba(234,88,12,0.05) 40%, transparent 70%);
          pointer-events: none;
        }

        .ma-hero-slash {
          position: absolute;
          top: 10px;
          left: -5%;
          width: 110%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--crimson), transparent);
          transform: rotate(-1.5deg);
          opacity: 0.5;
        }

        .ma-hero-slash-2 {
          position: absolute;
          bottom: 25px;
          left: -5%;
          width: 110%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--dojo-gold), transparent);
          transform: rotate(-1.5deg);
          opacity: 0.3;
        }

        .ma-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--crimson);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ma-hero-tag::before {
          content: '';
          display: block;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, var(--crimson), var(--ember));
        }

        .ma-hero-h1 {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: clamp(48px, 8.5vw, 100px);
          line-height: 0.9;
          font-weight: 900;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          color: var(--parchment);
          margin-bottom: 8px;
        }

        .ma-hero-h1 span.acc-red {
          color: var(--crimson-bright);
          display: block;
        }

        .ma-hero-h1 span.acc-gold {
          -webkit-text-stroke: 1px var(--dojo-gold-bright);
          color: transparent;
        }

        .ma-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(16px, 2.5vw, 23px);
          font-weight: 400;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--parchment-dim);
          margin-top: 22px;
          max-width: 600px;
          line-height: 1.35;
        }

        /* Key stats grid */
        .ma-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 44px;
        }

        @media (max-width: 640px) {
          .ma-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .ma-stat-tile {
          background: var(--dojo-surface);
          border: 1px solid var(--dojo-border);
          padding: 22px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .ma-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .ma-stat-tile:nth-child(1)::before { background: var(--crimson); }
        .ma-stat-tile:nth-child(2)::before { background: var(--ember); }
        .ma-stat-tile:nth-child(3)::before { background: var(--dojo-gold); }
        .ma-stat-tile:nth-child(4)::before { background: var(--dojo-green); }

        .ma-stat-tile:hover { border-color: var(--parchment-faint); }

        .ma-stat-num {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: clamp(22px, 2.8vw, 34px);
          font-weight: 700;
          line-height: 1;
          margin-bottom: 6px;
        }

        .ma-stat-tile:nth-child(1) .ma-stat-num { color: var(--crimson-bright); }
        .ma-stat-tile:nth-child(2) .ma-stat-num { color: var(--ember-bright); }
        .ma-stat-tile:nth-child(3) .ma-stat-num { color: var(--dojo-gold-bright); }
        .ma-stat-tile:nth-child(4) .ma-stat-num { color: var(--dojo-green-bright); }

        .ma-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--parchment-dim);
          line-height: 1.4;
        }

        .ma-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.05em;
          color: var(--parchment-faint);
          margin-top: 4px;
        }

        /* Animations */
        @keyframes ma-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ma-draw-bar {
          from { width: 0; }
        }

        /* Section title */
        .ma-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--parchment-dim);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 8px;
        }

        .ma-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--dojo-border);
        }

        /* Chart section */
        .ma-chart-section {
          margin-top: 56px;
          animation: ma-fade-up 0.5s ease 0.1s both;
        }

        .ma-chart-card {
          background: var(--dojo-surface);
          border: 1px solid var(--dojo-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .ma-chart-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--crimson), var(--ember), var(--dojo-gold));
        }

        .ma-chart-intro {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--parchment-dim);
          margin-bottom: 28px;
          max-width: 640px;
          line-height: 1.5;
          letter-spacing: 0.03em;
        }

        .ma-chart-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .ma-chart-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--parchment);
          min-width: 200px;
          flex-shrink: 0;
        }

        .ma-chart-bar-wrap {
          flex: 1;
          height: 20px;
          background: var(--dojo-surface-2);
          border: 1px solid var(--dojo-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .ma-chart-bar {
          height: 100%;
          border-radius: 2px;
          animation: ma-draw-bar 1.2s ease 0.4s both;
        }

        .ma-chart-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--parchment-dim);
          min-width: 72px;
          text-align: right;
          flex-shrink: 0;
        }

        /* Science cards grid */
        .ma-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .ma-cards-grid { grid-template-columns: 1fr; }
        }

        /* Science card */
        .ma-card {
          background: var(--dojo-surface);
          border: 1px solid var(--dojo-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: ma-fade-up 0.5s ease both;
        }

        .ma-card:hover { border-color: var(--parchment-faint); }

        .ma-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .ma-card.crimson::before { background: var(--crimson); }
        .ma-card.ember::before { background: var(--ember); }
        .ma-card.gold::before { background: var(--dojo-gold); }
        .ma-card.green::before { background: var(--dojo-green); }

        .ma-card-accent-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .ma-card.crimson .ma-card-accent-bg { background: var(--crimson-glow); }
        .ma-card.ember .ma-card-accent-bg { background: var(--ember-glow); }
        .ma-card.gold .ma-card-accent-bg { background: var(--dojo-gold-glow); }
        .ma-card.green .ma-card-accent-bg { background: var(--dojo-green-glow); }

        .ma-card.crimson:hover { box-shadow: inset 0 0 60px var(--crimson-glow); }
        .ma-card.ember:hover { box-shadow: inset 0 0 60px var(--ember-glow); }
        .ma-card.gold:hover { box-shadow: inset 0 0 60px var(--dojo-gold-glow); }
        .ma-card.green:hover { box-shadow: inset 0 0 60px var(--dojo-green-glow); }

        .ma-card-num {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 72px;
          font-weight: 900;
          line-height: 1;
          position: absolute;
          top: 20px;
          right: 24px;
          opacity: 0.055;
          letter-spacing: -0.05em;
        }

        .ma-card-icon-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ma-card-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .ma-card.crimson .ma-card-icon { background: var(--crimson-glow); }
        .ma-card.ember .ma-card-icon { background: var(--ember-glow); }
        .ma-card.gold .ma-card-icon { background: var(--dojo-gold-glow); }
        .ma-card.green .ma-card-icon { background: var(--dojo-green-glow); }

        .ma-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .ma-card.crimson .ma-card-kicker { color: var(--crimson-bright); }
        .ma-card.ember .ma-card-kicker { color: var(--ember-bright); }
        .ma-card.gold .ma-card-kicker { color: var(--dojo-gold-bright); }
        .ma-card.green .ma-card-kicker { color: var(--dojo-green-bright); }

        .ma-card-title {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: var(--parchment);
          line-height: 1.15;
          margin-bottom: 20px;
        }

        .ma-card-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ma-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.02);
          border-left: 2px solid var(--dojo-border);
          transition: border-color 0.15s ease;
        }

        .ma-finding:hover { background: rgba(255,255,255,0.035); }

        .ma-card.crimson .ma-finding:hover { border-left-color: var(--crimson-dim); }
        .ma-card.ember .ma-finding:hover { border-left-color: #9a3412; }
        .ma-card.gold .ma-finding:hover { border-left-color: var(--dojo-gold-dim); }
        .ma-card.green .ma-finding:hover { border-left-color: #14532d; }

        .ma-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .ma-finding-stat-val {
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .ma-card.crimson .ma-finding-stat-val { color: var(--crimson-bright); }
        .ma-card.ember .ma-finding-stat-val { color: var(--ember-bright); }
        .ma-card.gold .ma-finding-stat-val { color: var(--dojo-gold-bright); }
        .ma-card.green .ma-finding-stat-val { color: var(--dojo-green-bright); }

        .ma-finding-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--parchment-dim);
          margin-top: 3px;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        .ma-finding-body { flex: 1; }

        .ma-finding-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--parchment);
          margin-bottom: 3px;
        }

        .ma-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--parchment-dim);
          line-height: 1.45;
        }

        /* Card stagger */
        .ma-card:nth-child(1) { animation-delay: 0.0s; }
        .ma-card:nth-child(2) { animation-delay: 0.07s; }
        .ma-card:nth-child(3) { animation-delay: 0.14s; }
        .ma-card:nth-child(4) { animation-delay: 0.21s; }

        /* Divider */
        .ma-divider {
          width: 100%;
          height: 48px;
          position: relative;
          margin: 44px 0;
          overflow: hidden;
        }

        .ma-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--parchment-faint) 20%, var(--parchment-faint) 80%, transparent);
          transform: rotate(-1deg);
        }

        .ma-divider-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--dojo-black);
          padding: 4px 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--parchment-dim);
          white-space: nowrap;
        }

        /* Disclaimer */
        .ma-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--dojo-surface);
          border: 1px solid var(--dojo-border);
          border-left: 3px solid var(--parchment-faint);
        }

        .ma-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--parchment-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ma-hero-h1 { font-size: 48px; }
          .ma-card { padding: 24px 20px; }
          .ma-chart-card { padding: 24px 20px; }
          .ma-chart-label { min-width: 140px; font-size: 11px; }
          .ma-chart-val { min-width: 60px; font-size: 10px; }
        }

        @media (max-width: 640px) {
          .ma-chart-label { min-width: 110px; font-size: 11px; }
        }
      `}} />

      <div className="ma-root">
        {/* Header */}
        <header className="ma-header">
          <div className="ma-header-inner">
            <Link href="/workouts" className="ma-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="ma-header-label">Sports Science Series</div>
              <div className="ma-header-title">Martial Arts Science</div>
            </div>
          </div>
        </header>

        <main className="ma-main">
          {/* Hero */}
          <section className="ma-hero">
            <div className="ma-hero-embers" />
            <div className="ma-hero-slash" />
            <div className="ma-hero-slash-2" />

            <div className="ma-hero-tag">Combat Biomechanics &amp; Performance Science</div>

            <h1 className="ma-hero-h1">
              <span>MARTIAL ARTS</span>
              <span className="acc-red">PHYSI</span>
              <span className="acc-gold">OLOGY</span>
            </h1>

            <p className="ma-hero-sub">
              The science of striking force, anaerobic energy systems, decision-making speed, and the periodisation of elite combat athletes.
            </p>

            {/* Key stats */}
            <div className="ma-stats-grid">
              <div className="ma-stat-tile">
                <div className="ma-stat-num">5,600 N</div>
                <div className="ma-stat-label">TKD Turning Kick Force</div>
                <div className="ma-stat-ref">Estevan 2013</div>
              </div>
              <div className="ma-stat-tile">
                <div className="ma-stat-num">90% anaerobic</div>
                <div className="ma-stat-label">Judo Randori Energy</div>
                <div className="ma-stat-ref">Franchini 2011</div>
              </div>
              <div className="ma-stat-tile">
                <div className="ma-stat-num">3× faster</div>
                <div className="ma-stat-label">Expert Decision-Making</div>
                <div className="ma-stat-ref">Starkes 2003</div>
              </div>
              <div className="ma-stat-tile">
                <div className="ma-stat-num">65–75 kg</div>
                <div className="ma-stat-label">Elite Judoka Grip Strength</div>
                <div className="ma-stat-ref">Franchini 2007</div>
              </div>
            </div>
          </section>

          {/* Striking Force Chart */}
          <section className="ma-chart-section">
            <div className="ma-section-title">Striking Force Comparison</div>
            <div className="ma-chart-card">
              <p className="ma-chart-intro">
                Peak strike force (Newtons) measured via force plate or instrumented target across martial arts disciplines. Taekwondo's turning kick generates the highest single-limb impact force in combat sports, driven by superior hip-to-foot angular velocity chain.
              </p>
              {[
                { label: 'TKD Turning Kick', val: '5,600 N', pct: 100, color: '#dc2626' },
                { label: 'Karate Reverse Punch', val: '4,000 N', pct: 71, color: '#b91c1c' },
                { label: 'MMA Elbow Strike', val: '3,100 N', pct: 55, color: '#ea580c' },
                { label: 'MMA Ground-and-Pound', val: '2,600 N', pct: 46, color: '#ca8a04' },
                { label: 'Untrained Punch', val: '1,400 N', pct: 25, color: '#6b7280' },
              ].map(row => (
                <div key={row.label} className="ma-chart-row">
                  <div className="ma-chart-label">{row.label}</div>
                  <div className="ma-chart-bar-wrap">
                    <div
                      className="ma-chart-bar"
                      style={{ width: `${row.pct}%`, background: row.color, opacity: 0.8 }}
                    />
                  </div>
                  <div className="ma-chart-val">{row.val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Science Cards */}
          <div className="ma-divider">
            <div className="ma-divider-text">Research Findings</div>
          </div>

          <div className="ma-cards-grid">
            {/* Card 1: Striking Biomechanics */}
            <div className="ma-card crimson">
              <div className="ma-card-accent-bg" />
              <div className="ma-card-num">01</div>
              <div className="ma-card-icon-row">
                <div className="ma-card-icon">👊</div>
                <div className="ma-card-kicker">Biomechanics</div>
              </div>
              <div className="ma-card-title">Striking Biomechanics Across Disciplines</div>
              <div className="ma-card-findings">
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">3,000–4,000 N</div>
                    <div className="ma-finding-stat-ref">Gulledge 2006<br/>Force plate study</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Karate Reverse Punch</div>
                    <div className="ma-finding-desc">Karate reverse punch (gyaku-zuki) generates 3,000–4,000 N peak force in elite black belts vs. 1,200–1,800 N in untrained adults. Kinetic chain: rear-foot push → hip rotation → shoulder rotation → elbow extension → wrist snap. Hip rotation angular velocity: 500–600°/s. Kime (focus at impact) — rapid muscle co-contraction at moment of contact — transfers force efficiently and stiffens the kinetic chain, increasing peak force 20–30% over relaxed strikes.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">4,200–5,600 N</div>
                    <div className="ma-finding-stat-ref">Estevan 2013<br/>TKD biomechanics</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Taekwondo Turning Kick</div>
                    <div className="ma-finding-desc">Rear-leg turning kick (dollyo chagi) generates 4,200–5,600 N — higher than any hand technique. Foot velocity at impact: 12–14 m/s (43–50 km/h). Hip-to-foot angular velocity chain: hip abduction → external hip rotation → knee extension → ankle plantarflexion. World champion TKD athletes generate 15–25% more peak force than national-level competitors, driven primarily by superior hip rotation velocity rather than absolute leg strength.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">1,800–2,600 N</div>
                    <div className="ma-finding-stat-ref">Lenetsky 2015<br/>MMA biomechanics</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">MMA Ground-and-Pound</div>
                    <div className="ma-finding-desc">MMA ground-and-pound strikes (descending hammerfist/elbow from mounted position) generate 1,800–2,600 N, with the shorter kinetic chain compared to standing strikes offset by gravity contribution. Elbow strikes: 2,200–3,100 N peak (shorter distance = higher contact velocity relative to limb mass). Grappling transitions from stand-up to ground: metabolic cost equivalent to 90–95% VO₂max effort during scramble phases, creating tactical opportunity for opponent who maintains aerobic fitness.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">2.5–3.0× BW</div>
                    <div className="ma-finding-stat-ref">Kraemer 2004<br/>Wrestling mechanics</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Takedown Ground Reaction Forces</div>
                    <div className="ma-finding-desc">Double-leg takedown entry generates ground reaction forces of 2.5–3.0× body weight in the penetration step. Judo ippon seoi nage (shoulder throw): peak force on uke (thrown athlete): 6–8× body weight on landing impact — highest uncontrolled impact of any martial art technique. Sprawl defence against takedown: hip extension and downward pressure of 400–800 N from defending athlete must exceed attacker's penetration force to nullify the attempt.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Energy Systems */}
            <div className="ma-card ember">
              <div className="ma-card-accent-bg" />
              <div className="ma-card-num">02</div>
              <div className="ma-card-icon-row">
                <div className="ma-card-icon">⚡</div>
                <div className="ma-card-kicker">Energy Systems</div>
              </div>
              <div className="ma-card-title">Energy Systems in Combat Sports</div>
              <div className="ma-card-findings">
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">90% anaerobic</div>
                    <div className="ma-finding-stat-ref">Franchini 2011<br/>Combat sports physiology</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Judo Randori Energy Demand</div>
                    <div className="ma-finding-desc">Judo randori generates 90% anaerobic energy contribution during explosive grip-fight and throw sequences. Blood lactate post-match: 8–14 mmol/L. Heart rate: 90–95% HRmax throughout 5-minute match. Judo VO₂max: 55–65 mL/kg/min for elite men; 52–60 mL/kg/min for women. Despite high anaerobic demand during throws, aerobic fitness is the primary predictor of match performance — more gripping attempts per minute and higher throw success rate in final 2 minutes.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">75–85% aerobic</div>
                    <div className="ma-finding-stat-ref">Del Vecchio 2010<br/>BJJ competition</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">BJJ Ground Fighting Energy</div>
                    <div className="ma-finding-desc">Brazilian jiu-jitsu competition is 75–85% aerobic by energy contribution, reflecting the sustained moderate-intensity nature of positional control and submission hunting from guard or mount positions. Peak intensity: guard pass or submission attempt = near-maximal PCr burst (85–95% VO₂max for 3–8 s). BJJ-specific fitness: isometric grip strength, hip mobility, and anaerobic power for escape sequences predict performance better than VO₂max alone.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">All 3 systems</div>
                    <div className="ma-finding-stat-ref">Kirk 2015<br/>MMA physiology</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">MMA: Three-System Demand</div>
                    <div className="ma-finding-desc">MMA competition uniquely demands simultaneous readiness in all three energy pathways. Stand-up striking exchanges: 85–95% HRmax; grappling transitions: 80–90% HRmax; ground control: 65–75% HRmax (active recovery). Average UFC fight duration: 9–12 min (3 rounds × 5 min); championship: 24 min (5 rounds). VO₂max in elite MMA: 55–65 mL/kg/min; elite jiu-jitsu specialists 48–55 mL/kg/min reflecting less cardiovascular emphasis vs. sport-specific anaerobic conditioning.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">4–8% BW cut</div>
                    <div className="ma-finding-stat-ref">Artioli 2010<br/>Int J Sport Nutr</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Judo Weight Cutting</div>
                    <div className="ma-finding-desc">89% of elite judo athletes regularly cut weight before competition (IJF weigh-in protocols). Average cut: 4–5% body weight; extreme cases 7–8% BW in 24 hours. Methods: fluid restriction, sweat suit, sauna. Rehydration within 4 hours (current IJF same-day weigh-in): insufficient to restore VO₂max (−10–15% impairment), grip strength (−8–12%), and cognitive function (−12–18% reaction time). IJF same-day weigh-in (2017) has reduced extreme cutting but not eliminated it.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Decision-Making */}
            <div className="ma-card gold">
              <div className="ma-card-accent-bg" />
              <div className="ma-card-num">03</div>
              <div className="ma-card-icon-row">
                <div className="ma-card-icon">🧠</div>
                <div className="ma-card-kicker">Tactical Intelligence</div>
              </div>
              <div className="ma-card-title">Decision-Making &amp; Tactical Intelligence</div>
              <div className="ma-card-findings">
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">2.5–3.5× faster</div>
                    <div className="ma-finding-stat-ref">Starkes 2003<br/>Sport expertise</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Expert Fighter Decision Speed</div>
                    <div className="ma-finding-desc">Expert martial artists (10+ years, national/international level) process opponent movement patterns 2.5–3.5× faster than novices in video-based decision tasks, with identical laboratory simple reaction times. Expert advantage is entirely in pattern recognition, not motor speed. Kata (form practice) and sparring drills develop tactical schemas — mental libraries of attack-defence sequences — that allow sub-200ms defensive responses to telegraphed attacks.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">6–8 attacks/min</div>
                    <div className="ma-finding-stat-ref">Franchini 2013<br/>IJF technical analysis</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Elite Judo Attack Frequency</div>
                    <div className="ma-finding-desc">Elite judo players attempt 6–8 technical throwing or ne-waza (ground) attacks per minute of randori vs. 2–3 attempts/min for national-level competitors. Attack frequency is the strongest predictor of match victory — not individual technique quality. This statistical finding is widely used in elite judo coaching: maximise attack attempts per minute while maintaining defensive integrity, rather than perfecting single techniques.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">200–250 ms</div>
                    <div className="ma-finding-stat-ref">Calmet 2010<br/>Judo anticipation</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Grip Anticipation Advantage</div>
                    <div className="ma-finding-desc">Experienced judo players use opponent grip kinematics (wrist angle, elbow position, grip tightening) to anticipate throw attempts 200–250 ms before initiation — sufficient for defensive stepping or kuzushi (off-balancing) nullification. This anticipation advantage completely disappears when fighters are matched at the same experience level, explaining why elite vs. national-level match outcomes are largely determined by who executes techniques with less telegraphing.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">15–35% above baseline</div>
                    <div className="ma-finding-stat-ref">Salvador 2003<br/>Combat sport cortisol</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Optimal Pre-Competition Cortisol</div>
                    <div className="ma-finding-desc">Pre-competition cortisol elevation of 15–35% above baseline improves combat sport performance by sharpening sensory processing and aggressive intent — the 'optimal pre-competition arousal' window. Cortisol elevation &gt;50% above baseline (excessive anxiety) impairs decision-making speed and motor programme execution. Heart rate variability (HRV) in the 4–6 hours before competition: a morning HRV reading at &lt;85% of baseline is a reliable indicator of over-arousal requiring psycho-physiological regulation techniques.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Training Science */}
            <div className="ma-card green">
              <div className="ma-card-accent-bg" />
              <div className="ma-card-num">04</div>
              <div className="ma-card-icon-row">
                <div className="ma-card-icon">📅</div>
                <div className="ma-card-kicker">Periodisation</div>
              </div>
              <div className="ma-card-title">Training Science &amp; Periodisation</div>
              <div className="ma-card-findings">
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">5–6 sessions/week</div>
                    <div className="ma-finding-stat-ref">Artioli 2012<br/>Training loads</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Elite Judo/BJJ Training Volume</div>
                    <div className="ma-finding-desc">Elite judo and BJJ competitors average 5–6 training sessions per week of 90–120 min each. Training composition: 30% technical drilling (kata/techniques), 50% randori/sparring (highest physiological demand), 20% physical conditioning. Weekly training load equivalent: 35–50 km running equivalent in energy expenditure. Deload weeks (1 per 4–6-week block): 40% volume reduction maintains fitness while enabling supercompensation and reducing chronic overuse injury risk.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">65–75 kg</div>
                    <div className="ma-finding-stat-ref">Franchini 2007<br/>Judo grip strength</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Elite Judoka Grip Strength</div>
                    <div className="ma-finding-desc">Elite judo athletes demonstrate dominant-hand grip strength of 65–75 kg (crush grip dynamometer) vs. 45–55 kg in national-level competitors and 35–45 kg in age-matched non-athletes. Grip strength is the single strongest physical performance predictor in judo — outperforming VO₂max, bench press, and squat in multivariate models. Training: towel pull-ups, thick-bar deadlifts, gi-specific pull-up variations, and finger extension isometrics to prevent flexor-extensor strength imbalance causing tendinopathy.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">40–50% taper</div>
                    <div className="ma-finding-stat-ref">Turner 2017<br/>Combat periodisation</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Competition Periodisation</div>
                    <div className="ma-finding-desc">Optimal periodisation for competitive combat sports: preparation phase (8–16 weeks) prioritises technical volume and general fitness; specific preparation (4–8 weeks) increases sparring intensity and sport-specific conditioning; competition phase (2–4 weeks) tapers volume 40–50% while maintaining intensity; transition (2–4 weeks) active recovery. Single-periodisation suits national championships; double-periodisation required for IJF/UFC fight camps with 4–6 competitive events annually.</div>
                  </div>
                </div>
                <div className="ma-finding">
                  <div className="ma-finding-stat">
                    <div className="ma-finding-stat-val">35–45% drilling</div>
                    <div className="ma-finding-stat-ref">Tanaka 2016<br/>IJF World Championships</div>
                  </div>
                  <div className="ma-finding-body">
                    <div className="ma-finding-title">Kata Drilling vs. Sparring Ratio</div>
                    <div className="ma-finding-desc">Analysis of training time allocation in medalists vs. non-medalists at IJF World Championships found that athletes who allocated 35–45% of training to technical drilling (kata, partner technique work) significantly outperformed those who sparred &gt;70% of training time. Hypothesis: high sparring ratios create compensatory movement patterns and increase injury rate; technical work reinforces optimal biomechanics under low fatigue. Modern periodisation increasingly separates technical mastery work from physiological conditioning days.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="ma-disclaimer">
            <div className="ma-disclaimer-text">
              All statistics cited from peer-reviewed sports science literature. Sources: Gulledge (2006) force plate study · Estevan (2013) TKD biomechanics · Lenetsky (2015) MMA biomechanics · Kraemer (2004) wrestling mechanics · Franchini (2011) comprehensive combat sports physiology review · Del Vecchio (2010) BJJ competition analysis · Kirk (2015) MMA physiology · Artioli (2010) Int J Sport Nutr Exerc Metab · Starkes (2003) sport expertise in combat · Franchini (2013) IJF technical analysis · Calmet (2010) judo anticipation study · Salvador (2003) combat sport cortisol · Artioli (2012) training loads in combat sports · Franchini (2007) judo grip strength · Turner (2017) combat sport periodisation · Tanaka (2016) IJF World Championship analysis
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
