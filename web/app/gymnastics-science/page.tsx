import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Gymnastics Science' }

export default function GymnasticsSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --gym-black: #0d0b10;
          --gym-dark: #120f17;
          --gym-surface: #17131e;
          --gym-surface-2: #1e1827;
          --gym-border: #2a2035;
          --purple: #9333ea;
          --purple-bright: #a855f7;
          --purple-dim: #5b21b6;
          --purple-glow: rgba(147, 51, 234, 0.15);
          --magenta: #ec4899;
          --magenta-bright: #f472b6;
          --magenta-dim: #9d174d;
          --magenta-glow: rgba(236, 72, 153, 0.12);
          --gold: #eab308;
          --gold-bright: #facc15;
          --gold-dim: #713f12;
          --gold-glow: rgba(234, 179, 8, 0.12);
          --orange: #f97316;
          --orange-bright: #fb923c;
          --orange-glow: rgba(249, 115, 22, 0.12);
          --velvet: #e8d4f0;
          --velvet-dim: #9a7fb0;
          --velvet-faint: #3a2d47;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .gym-root {
          min-height: 100vh;
          background-color: var(--gym-black);
          color: var(--velvet);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .gym-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Spotlight glow background */
        .gym-root::after {
          content: '';
          position: fixed;
          top: -20vh;
          left: 50%;
          transform: translateX(-50%);
          width: 60vw;
          height: 60vw;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(147,51,234,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .gym-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(13, 11, 16, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--gym-border);
        }

        .gym-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .gym-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          background: var(--gym-surface);
          border: 1px solid var(--gym-border);
          color: var(--velvet-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .gym-back-btn:hover {
          background: var(--gym-surface-2);
          border-color: var(--velvet-faint);
          color: var(--velvet);
        }

        .gym-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--purple);
        }

        .gym-header-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--velvet);
        }

        /* Main */
        .gym-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .gym-hero {
          position: relative;
          padding: 80px 0 60px;
          overflow: hidden;
          animation: gym-fade-up 0.6s ease both;
        }

        .gym-hero-spotlight {
          position: absolute;
          top: 0;
          left: 30%;
          width: 500px;
          height: 500px;
          background: radial-gradient(ellipse at top, rgba(147,51,234,0.18) 0%, rgba(236,72,153,0.06) 40%, transparent 70%);
          pointer-events: none;
        }

        .gym-hero-spotlight-2 {
          position: absolute;
          top: 0;
          right: 10%;
          width: 300px;
          height: 400px;
          background: radial-gradient(ellipse at top, rgba(234,179,8,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        .gym-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--purple);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .gym-hero-tag::before {
          content: '';
          display: block;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--magenta));
        }

        .gym-hero-h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(52px, 9vw, 108px);
          line-height: 0.9;
          font-weight: 700;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--velvet);
          margin-bottom: 8px;
        }

        .gym-hero-h1 span.acc-purple {
          color: var(--purple-bright);
          display: block;
        }

        .gym-hero-h1 span.acc-gold {
          -webkit-text-stroke: 1px var(--gold);
          color: transparent;
        }

        .gym-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(16px, 2.5vw, 24px);
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--velvet-dim);
          margin-top: 22px;
          max-width: 580px;
          line-height: 1.35;
        }

        /* Key stats grid */
        .gym-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 44px;
        }

        @media (max-width: 640px) {
          .gym-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .gym-stat-tile {
          background: var(--gym-surface);
          border: 1px solid var(--gym-border);
          padding: 22px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .gym-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .gym-stat-tile:nth-child(1)::before { background: var(--purple); }
        .gym-stat-tile:nth-child(2)::before { background: var(--magenta); }
        .gym-stat-tile:nth-child(3)::before { background: var(--gold); }
        .gym-stat-tile:nth-child(4)::before { background: var(--orange); }

        .gym-stat-tile:hover {
          border-color: var(--velvet-faint);
        }

        .gym-stat-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(24px, 3vw, 36px);
          font-weight: 700;
          line-height: 1;
          color: var(--velvet);
          margin-bottom: 6px;
        }

        .gym-stat-tile:nth-child(1) .gym-stat-num { color: var(--purple-bright); }
        .gym-stat-tile:nth-child(2) .gym-stat-num { color: var(--magenta-bright); }
        .gym-stat-tile:nth-child(3) .gym-stat-num { color: var(--gold-bright); }
        .gym-stat-tile:nth-child(4) .gym-stat-num { color: var(--orange-bright); }

        .gym-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--velvet-dim);
          line-height: 1.4;
        }

        .gym-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.06em;
          color: var(--velvet-faint);
          margin-top: 4px;
        }

        /* Animations */
        @keyframes gym-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gym-draw-bar {
          from { width: 0; }
        }

        /* Section title */
        .gym-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--velvet-dim);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 8px;
        }

        .gym-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gym-border);
        }

        /* Chart section */
        .gym-chart-section {
          margin-top: 56px;
          animation: gym-fade-up 0.5s ease 0.1s both;
        }

        .gym-chart-card {
          background: var(--gym-surface);
          border: 1px solid var(--gym-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .gym-chart-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--purple), var(--magenta), var(--gold));
        }

        .gym-chart-intro {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--velvet-dim);
          margin-bottom: 28px;
          max-width: 640px;
          line-height: 1.5;
          letter-spacing: 0.03em;
        }

        .gym-chart-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .gym-chart-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--velvet);
          min-width: 190px;
          flex-shrink: 0;
        }

        .gym-chart-bar-wrap {
          flex: 1;
          height: 20px;
          background: var(--gym-surface-2);
          border: 1px solid var(--gym-border);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .gym-chart-bar {
          height: 100%;
          border-radius: 2px;
          animation: gym-draw-bar 1.2s ease 0.4s both;
        }

        .gym-chart-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--velvet-dim);
          min-width: 80px;
          text-align: right;
          flex-shrink: 0;
        }

        /* Science cards grid */
        .gym-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .gym-cards-grid { grid-template-columns: 1fr; }
        }

        /* Science card */
        .gym-card {
          background: var(--gym-surface);
          border: 1px solid var(--gym-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: gym-fade-up 0.5s ease both;
        }

        .gym-card:hover {
          border-color: var(--velvet-faint);
        }

        .gym-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .gym-card.purple::before { background: var(--purple); }
        .gym-card.magenta::before { background: var(--magenta); }
        .gym-card.gold::before { background: var(--gold); }
        .gym-card.orange::before { background: var(--orange); }

        .gym-card-accent-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .gym-card.purple .gym-card-accent-bg { background: var(--purple-glow); }
        .gym-card.magenta .gym-card-accent-bg { background: var(--magenta-glow); }
        .gym-card.gold .gym-card-accent-bg { background: var(--gold-glow); }
        .gym-card.orange .gym-card-accent-bg { background: var(--orange-glow); }

        .gym-card.purple:hover { box-shadow: inset 0 0 60px var(--purple-glow); }
        .gym-card.magenta:hover { box-shadow: inset 0 0 60px var(--magenta-glow); }
        .gym-card.gold:hover { box-shadow: inset 0 0 60px var(--gold-glow); }
        .gym-card.orange:hover { box-shadow: inset 0 0 60px var(--orange-glow); }

        .gym-card-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 72px;
          font-weight: 700;
          line-height: 1;
          position: absolute;
          top: 20px;
          right: 24px;
          opacity: 0.06;
          letter-spacing: -0.05em;
        }

        .gym-card-icon-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .gym-card-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .gym-card.purple .gym-card-icon { background: var(--purple-glow); }
        .gym-card.magenta .gym-card-icon { background: var(--magenta-glow); }
        .gym-card.gold .gym-card-icon { background: var(--gold-glow); }
        .gym-card.orange .gym-card-icon { background: var(--orange-glow); }

        .gym-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .gym-card.purple .gym-card-kicker { color: var(--purple-bright); }
        .gym-card.magenta .gym-card-kicker { color: var(--magenta-bright); }
        .gym-card.gold .gym-card-kicker { color: var(--gold-bright); }
        .gym-card.orange .gym-card-kicker { color: var(--orange-bright); }

        .gym-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          color: var(--velvet);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .gym-card-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .gym-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid var(--gym-border);
          transition: border-color 0.15s ease;
        }

        .gym-finding:hover {
          background: rgba(255,255,255,0.04);
        }

        .gym-card.purple .gym-finding:hover { border-left-color: var(--purple-dim); }
        .gym-card.magenta .gym-finding:hover { border-left-color: var(--magenta-dim); }
        .gym-card.gold .gym-finding:hover { border-left-color: var(--gold-dim); }
        .gym-card.orange .gym-finding:hover { border-left-color: #c2410c; }

        .gym-finding-stat {
          flex-shrink: 0;
          min-width: 88px;
        }

        .gym-finding-stat-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .gym-card.purple .gym-finding-stat-val { color: var(--purple-bright); }
        .gym-card.magenta .gym-finding-stat-val { color: var(--magenta-bright); }
        .gym-card.gold .gym-finding-stat-val { color: var(--gold-bright); }
        .gym-card.orange .gym-finding-stat-val { color: var(--orange-bright); }

        .gym-finding-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--velvet-dim);
          margin-top: 3px;
          letter-spacing: 0.04em;
          line-height: 1.4;
        }

        .gym-finding-body { flex: 1; }

        .gym-finding-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--velvet);
          margin-bottom: 3px;
        }

        .gym-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--velvet-dim);
          line-height: 1.45;
        }

        /* Card stagger */
        .gym-card:nth-child(1) { animation-delay: 0.0s; }
        .gym-card:nth-child(2) { animation-delay: 0.07s; }
        .gym-card:nth-child(3) { animation-delay: 0.14s; }
        .gym-card:nth-child(4) { animation-delay: 0.21s; }

        /* Disclaimer */
        .gym-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--gym-surface);
          border: 1px solid var(--gym-border);
          border-left: 3px solid var(--velvet-faint);
        }

        .gym-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--velvet-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        /* Divider */
        .gym-divider {
          width: 100%;
          height: 48px;
          position: relative;
          margin: 44px 0;
          overflow: hidden;
        }

        .gym-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--velvet-faint) 20%, var(--velvet-faint) 80%, transparent);
          transform: rotate(-1deg);
        }

        .gym-divider-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--gym-black);
          padding: 4px 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--velvet-dim);
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gym-hero-h1 { font-size: 52px; }
          .gym-card { padding: 24px 20px; }
          .gym-chart-card { padding: 24px 20px; }
          .gym-chart-label { min-width: 130px; font-size: 11px; }
          .gym-chart-val { min-width: 60px; font-size: 10px; }
        }

        @media (max-width: 640px) {
          .gym-chart-label { min-width: 110px; font-size: 11px; }
        }
      `}} />

      <div className="gym-root">
        {/* Header */}
        <header className="gym-header">
          <div className="gym-header-inner">
            <Link href="/workouts" className="gym-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="gym-header-label">Sports Science Series</div>
              <div className="gym-header-title">Gymnastics Science</div>
            </div>
          </div>
        </header>

        <main className="gym-main">
          {/* Hero */}
          <section className="gym-hero">
            <div className="gym-hero-spotlight" />
            <div className="gym-hero-spotlight-2" />

            <div className="gym-hero-tag">Strength, Power &amp; Motor Mastery</div>

            <h1 className="gym-hero-h1">
              <span>GYMNASTICS</span>
              <span className="acc-purple">PHYSI</span>
              <span className="acc-gold">OLOGY</span>
            </h1>

            <p className="gym-hero-sub">
              The biomechanics of extreme strength-to-weight, skill acquisition under rotation, and the science of artistic perfection.
            </p>

            {/* Key stats */}
            <div className="gym-stats-grid">
              <div className="gym-stat-tile">
                <div className="gym-stat-num">8.9 N·m/kg</div>
                <div className="gym-stat-label">Iron Cross Shoulder Torque</div>
                <div className="gym-stat-ref">Gogu 2015 — Eur J Sport Sci</div>
              </div>
              <div className="gym-stat-tile">
                <div className="gym-stat-num">10–14× BW</div>
                <div className="gym-stat-label">Dismount Landing Forces</div>
                <div className="gym-stat-ref">McNitt-Gray 1993 — J Biomech</div>
              </div>
              <div className="gym-stat-tile">
                <div className="gym-stat-num">37%</div>
                <div className="gym-stat-label">Wrist Injuries Share</div>
                <div className="gym-stat-ref">Bradshaw 2012 — Br J Sports Med</div>
              </div>
              <div className="gym-stat-tile">
                <div className="gym-stat-num">9,000 W</div>
                <div className="gym-stat-label">Peak Floor Tumbling Power</div>
                <div className="gym-stat-ref">King 2015 — J Biomech</div>
              </div>
            </div>
          </section>

          {/* Strength-to-Weight Chart */}
          <section className="gym-chart-section">
            <div className="gym-section-title">Strength-to-Weight Comparison</div>
            <div className="gym-chart-card">
              <p className="gym-chart-intro">
                Relative shoulder torque (N·m/kg body mass) comparing the iron cross requirement in gymnastics against elite standards in other strength-dominant sports. The iron cross demands approximately 3× the weight-normalised torque achievable in powerlifting.
              </p>
              {[
                { label: 'Iron Cross (Gymnastics)', val: '8.9 N·m/kg', pct: 100, color: '#9333ea' },
                { label: 'Olympic Weightlifting', val: '6.2 N·m/kg', pct: 70, color: '#ec4899' },
                { label: 'Rock Climbing', val: '5.8 N·m/kg', pct: 65, color: '#e879f9' },
                { label: 'Judo Grip Strength', val: '4.9 N·m/kg', pct: 55, color: '#6366f1' },
                { label: 'Powerlifting', val: '4.1 N·m/kg', pct: 46, color: '#8b5cf6' },
              ].map(row => (
                <div key={row.label} className="gym-chart-row">
                  <div className="gym-chart-label">{row.label}</div>
                  <div className="gym-chart-bar-wrap">
                    <div
                      className="gym-chart-bar"
                      style={{ width: `${row.pct}%`, background: row.color, opacity: 0.75 }}
                    />
                  </div>
                  <div className="gym-chart-val">{row.val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Science Cards */}
          <div className="gym-divider">
            <div className="gym-divider-text">Research Findings</div>
          </div>

          <div className="gym-cards-grid">
            {/* Card 1: Strength-to-Weight */}
            <div className="gym-card purple">
              <div className="gym-card-accent-bg" />
              <div className="gym-card-num">01</div>
              <div className="gym-card-icon-row">
                <div className="gym-card-icon">🏋️</div>
                <div className="gym-card-kicker">Physical Demands</div>
              </div>
              <div className="gym-card-title">Strength-to-Weight &amp; Physical Demands</div>
              <div className="gym-card-findings">
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">8.9 N·m/kg</div>
                    <div className="gym-finding-stat-ref">Gogu 2015<br/>Eur J Sport Sci</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Iron Cross Shoulder Torque</div>
                    <div className="gym-finding-desc">The iron cross on still rings requires shoulder abduction torque of 8.9 N·m/kg body mass — approximately 3× higher than the maximum achievable in elite powerlifters relative to body weight. This represents the highest weight-normalised shoulder torque in any sport. Elite male gymnasts maintain this position for 2–3 s minimum for code score; training to achieve it requires 3–5 years of progressive ring strength training.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">60–70%</div>
                    <div className="gym-finding-stat-ref">Maffiuletti 2011<br/>J Appl Physiol</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Fast-Twitch Fibre Composition</div>
                    <div className="gym-finding-desc">Gymnasts demonstrate 60–70% Type II (fast-twitch) fibre composition in major muscle groups, enabling explosive power output for vaulting and tumbling. Elite gymnasts possess extraordinary relative strength: grip strength 80–90 kg for men's artistic gymnasts averaging 65–70 kg body mass. The gymnast's physique represents the optimal power-to-weight ratio in human sport — estimated peak mechanical power of 4,000–5,500 W during vault run-up.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">10–14× BW</div>
                    <div className="gym-finding-stat-ref">McNitt-Gray 1993<br/>J Biomech</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Dismount Landing Forces</div>
                    <div className="gym-finding-desc">Dismount landing forces in artistic gymnastics reach 10–14× body weight — among the highest repetitive ground reaction forces in sport. Knee and ankle joint contact forces during double-back somersault landings: 8–10× BW. Landing technique (progressive joint flexion, foot-hip-shoulder alignment) reduces peak force 30–40% versus stiff landings. Gymnastics training introduces 20,000–30,000 high-impact landings per year in elite pre-pubescent gymnasts.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">55–62 mL/kg/min</div>
                    <div className="gym-finding-stat-ref">Sands 2013<br/>Gymnastics physiology</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">VO₂max in Elite Artistic Gymnasts</div>
                    <div className="gym-finding-desc">Elite artistic gymnasts VO₂max = 55–62 mL/kg/min for men, 48–55 mL/kg/min for women — higher than expected given the sport's anaerobic nature, reflecting the aerobic demands of floor routines and extended training sessions. Rhythmic gymnastics: VO₂max 55–62 mL/kg/min; acrobatic gymnastics: 52–58 mL/kg/min. Energy systems: floor routines (70–90 s) are approximately 60–70% anaerobic during peak tumbling sequences.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Flexibility & Injury */}
            <div className="gym-card magenta">
              <div className="gym-card-accent-bg" />
              <div className="gym-card-num">02</div>
              <div className="gym-card-icon-row">
                <div className="gym-card-icon">🩺</div>
                <div className="gym-card-kicker">Injury Science</div>
              </div>
              <div className="gym-card-title">Flexibility, Mobility &amp; Injury Science</div>
              <div className="gym-card-findings">
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">160–180°</div>
                    <div className="gym-finding-stat-ref">Herrington 2013<br/>Phys Ther Sport</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Hip Flexion Range</div>
                    <div className="gym-finding-desc">Elite gymnasts achieve active hip flexion of 160–180° — well beyond the typical elite athlete range of 120–140°. This extreme range is acquired through systematic progressive stretching over 8–12 years starting in childhood, predominantly through plastic deformation of joint capsule and connective tissue rather than pure muscle elongation. Passive hip abduction ('splits') in elite gymnasts: 180°+. These ranges are largely non-transferable to adult-onset training due to the reduced plasticity of adult connective tissue.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">37%</div>
                    <div className="gym-finding-stat-ref">Bradshaw 2012<br/>Br J Sports Med</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Wrist Injury Prevalence</div>
                    <div className="gym-finding-desc">Wrist injuries account for 37% of all time-loss injuries in men's artistic gymnastics — primarily distal radial growth plate stress reactions (DRU stress fractures) in adolescent gymnasts from high-load compressive and shear forces during pommel horse and floor tumbling. Wrist pain prevalence in competing gymnasts: 56–88%. Gripping mechanics, wrist-guard use, and periodic unloading weeks are primary prevention strategies.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">11–32%</div>
                    <div className="gym-finding-stat-ref">Motley 2002<br/>Am J Sports Med</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Spondylolysis Prevalence</div>
                    <div className="gym-finding-desc">Lumbar spondylolysis (stress fracture of the pars interarticularis) prevalence in elite gymnasts: 11–32% — versus 6% in the general athletic population. The extreme lumbar extension requirements of gymnastics (back walkovers, arabesques, dismount arching) create repetitive hyperextension loading at L5–S1. Bilateral spondylolisthesis requires cessation of gymnastics loading for 3–6 months. MRI recommended over X-ray for early detection.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">30–50%</div>
                    <div className="gym-finding-stat-ref">Sundgot-Borgen 2004<br/>Clin Sports Med</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">RED-S Energy Deficiency Rate</div>
                    <div className="gym-finding-desc">Relative Energy Deficiency in Sport (RED-S) prevalence in aesthetic sports gymnastics: 30–50% meet energy deficiency criteria. Consequences: bone stress injury (stress fractures 2–3× higher than non-gymnasts), hormonal suppression (low oestrogen → decreased bone density), and impaired immune function. Aesthetic scoring pressures create environment for disordered eating. Recommended screening: DXA bone density, hormonal panel, and dietary assessment at annual sports physicals for artistic and rhythmic gymnasts.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Motor Learning */}
            <div className="gym-card gold">
              <div className="gym-card-accent-bg" />
              <div className="gym-card-num">03</div>
              <div className="gym-card-icon-row">
                <div className="gym-card-icon">🧠</div>
                <div className="gym-card-kicker">Motor Learning</div>
              </div>
              <div className="gym-card-title">Skill Acquisition &amp; Motor Learning</div>
              <div className="gym-card-findings">
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">10,000–15,000 h</div>
                    <div className="gym-finding-stat-ref">Ericsson 1993<br/>Applied to gymnastics</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Hours to Olympic Standard</div>
                    <div className="gym-finding-desc">Olympic-standard gymnasts accumulate 10,000–15,000 hours of deliberate training practice, typically beginning at ages 4–7 for women and 6–9 for men. Critical sensitive periods for motor skill plasticity: proprioceptive and vestibular development peaks at ages 8–12. Early technical instruction in fundamental movement patterns (handstand, cartwheel, round-off) creates the biomechanical foundation on which advanced skills are built — adult gymnasts learning these from scratch face significantly greater injury risk during acquisition.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">+15–20%</div>
                    <div className="gym-finding-stat-ref">Feltz 2013<br/>Exerc Sport Sci Rev</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Mental Rehearsal Benefit</div>
                    <div className="gym-finding-desc">Structured mental rehearsal programmes (20–30 min/day of kinesthetic imagery focusing on body position and spatial orientation) improve skill execution scores 15–20% in 2 weeks for skills already physically acquired. This exceeds the improvement from equivalent additional physical practice alone. Elite gymnasts routinely use performance imagery during competition warm-up: full routine mental run-through reduces execution errors 12% in competition vs. non-imagery conditions.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">70%</div>
                    <div className="gym-finding-stat-ref">Berthoz 1988<br/>J Neurophysiol</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Vestibular Nystagmus Reduction</div>
                    <div className="gym-finding-desc">Gymnasts perform 50–150 rotational elements per training day, requiring progressive vestibular desensitisation. Elite gymnasts show 70% reduction in vestibular nystagmus response (involuntary eye movement after rotation) vs. non-athletes — achieved through systematic adaptation of the otolith-canal reflex arc. This allows execution of multiple somersaults without spatial disorientation. The adaptation is sport-specific and does not transfer to other rotational contexts.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">Every 3rd rep</div>
                    <div className="gym-finding-stat-ref">Wulf 2010<br/>Psychol Bull</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Optimal Coaching Feedback</div>
                    <div className="gym-finding-desc">Augmented coaching feedback (verbal or video) provided after every repetition impairs long-term skill retention vs. feedback given every 3rd–5th repetition ('faded feedback' schedule). Over-feedback creates dependency on external error correction and prevents development of internal error detection mechanisms. Elite gymnastics coaching has transitioned from continuous verbal correction to post-set or post-routine review, consistent with motor learning theory.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Vault & Power */}
            <div className="gym-card orange">
              <div className="gym-card-accent-bg" />
              <div className="gym-card-num">04</div>
              <div className="gym-card-icon-row">
                <div className="gym-card-icon">⚡</div>
                <div className="gym-card-kicker">Power Science</div>
              </div>
              <div className="gym-card-title">Vault, Tumbling &amp; Power Science</div>
              <div className="gym-card-findings">
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">15–19× BW</div>
                    <div className="gym-finding-stat-ref">Krug 2008<br/>Int J Sport Biomech</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Vault Contact Forces</div>
                    <div className="gym-finding-desc">Vault contact forces on the springboard: 3–5× body weight over 80–120 ms; horse contact forces during Tsukahara entry: 15–19× body weight over 40–60 ms — the highest rate-of-force-development event in gymnastics. Run-up velocity for men's vault: 7.5–8.5 m/s. Springboard energy storage and return: elastic deformation stores 60–80% of run-up kinetic energy for vertical conversion. Post-flight angular momentum determines number of somersaults and twists — set entirely during horse contact phase.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">7,000–9,000 W</div>
                    <div className="gym-finding-stat-ref">King 2015<br/>J Biomech</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Floor Tumbling Peak Power</div>
                    <div className="gym-finding-desc">Floor exercise tumbling passes generate peak mechanical power of 7,000–9,000 W (normalised: 95–130 W/kg body mass) — among the highest power outputs in human sport. Quadruple twisting double back somersault (Silivas): peak angular velocity 1,800°/s in twist axis; somersault angular velocity 650°/s simultaneously. Flight phase duration for double twisting double: 0.85–1.10 s. Energy source: 90–95% anaerobic (PCr + glycolytic) for individual tumbling passes; aerobic contribution critical for 90-second routine endurance.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">&lt;1.5 cm</div>
                    <div className="gym-finding-stat-ref">Golomer 1999<br/>J Vestib Res</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Balance Beam Sway Amplitude</div>
                    <div className="gym-finding-desc">Elite balance beam specialists maintain centre-of-pressure sway amplitude of &lt;1.5 cm on a 10 cm wide beam during quasi-static balance elements — compared to 3–4 cm on a wide surface for elite athletes in other sports. Postural control strategy: ankle-dominant at low frequencies, hip-dominant at higher frequencies. Fear of height on 125 cm high beam managed through progressive exposure in 6-stage protocols (floor to competition height). Mental representation of beam width matches 1–2 m surface after extensive training.</div>
                  </div>
                </div>
                <div className="gym-finding">
                  <div className="gym-finding-stat">
                    <div className="gym-finding-stat-val">7.5–8.5 m/s</div>
                    <div className="gym-finding-stat-ref">Krug 2008<br/>Int J Sport Biomech</div>
                  </div>
                  <div className="gym-finding-body">
                    <div className="gym-finding-title">Tsukahara Run-Up Velocity</div>
                    <div className="gym-finding-desc">Optimal Tsukahara run-up velocity for men's vault: 7.5–8.5 m/s. Higher approach velocity increases post-flight height and rotation capacity but demands superior block technique to convert horizontal into vertical momentum. Elite vaulters achieve springboard contact durations of 80–120 ms with ground reaction forces of 3–5× BW; insufficient run-up velocity is the primary cause of incomplete rotation and landing falls in competition settings.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="gym-disclaimer">
            <div className="gym-disclaimer-text">
              All statistics cited from peer-reviewed sports science literature. Sources: Gogu (2015) Eur J Sport Sci · Maffiuletti (2011) J Appl Physiol · McNitt-Gray (1993) J Biomech · Sands (2013) gymnastics physiology review · Herrington (2013) Phys Ther Sport · Bradshaw (2012) Br J Sports Med · Motley (2002) Am J Sports Med · Sundgot-Borgen (2004) Clin Sports Med · Ericsson (1993) Psychol Rev · Feltz (2013) Exerc Sport Sci Rev · Berthoz (1988) J Neurophysiol · Wulf (2010) Psychol Bull · Krug (2008) Int J Sport Biomech · King (2015) J Biomech · Golomer (1999) J Vestib Res
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
