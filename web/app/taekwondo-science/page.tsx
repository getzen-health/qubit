import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Taekwondo Science' }

export default function TaekwondoSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&family=Noto+Sans:wght@400;700&display=swap');

        :root {
          --tkd-dark: #0a0505;
          --tkd-red: #c0392b;
          --tkd-blue: #1a5276;
          --tkd-white: #f8f9fa;
          --tkd-gold: #f39c12;
          --tkd-surface: #140909;
          --tkd-surface-2: #1c0e0e;
          --tkd-border-red: rgba(192, 57, 43, 0.25);
          --tkd-border-blue: rgba(26, 82, 118, 0.35);
          --tkd-red-glow: rgba(192, 57, 43, 0.12);
          --tkd-blue-glow: rgba(26, 82, 118, 0.12);
          --tkd-gold-glow: rgba(243, 156, 18, 0.12);
          --tkd-muted: #9ca3af;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .tkd-root {
          min-height: 100vh;
          background-color: var(--tkd-dark);
          color: var(--tkd-white);
          font-family: 'Noto Sans KR', 'Noto Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle taegeuk-inspired radial gradient backdrop */
        .tkd-root::before {
          content: '';
          position: fixed;
          top: -20vh;
          right: -20vw;
          width: 80vw;
          height: 80vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,82,118,0.07) 0%, rgba(192,57,43,0.04) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .tkd-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 5, 5, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--tkd-border-red);
        }

        .tkd-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tkd-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          background: var(--tkd-surface);
          border: 1px solid var(--tkd-border-red);
          color: var(--tkd-muted);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .tkd-back-btn:hover {
          background: var(--tkd-surface-2);
          border-color: var(--tkd-red);
          color: var(--tkd-white);
        }

        .tkd-header-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--tkd-red);
        }

        .tkd-header-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--tkd-white);
        }

        /* Main container */
        .tkd-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .tkd-hero {
          position: relative;
          padding: 70px 0 55px;
          overflow: hidden;
          animation: tkd-fade-up 0.55s ease both;
        }

        .tkd-hero-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 55%;
          height: 100%;
          background: radial-gradient(ellipse at top right, rgba(192,57,43,0.09) 0%, rgba(26,82,118,0.05) 50%, transparent 75%);
          pointer-events: none;
        }

        .tkd-hero-stripe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, var(--tkd-red), var(--tkd-blue), transparent);
          opacity: 0.7;
        }

        .tkd-hero-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--tkd-red);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tkd-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, var(--tkd-red), var(--tkd-blue));
        }

        .tkd-hero-h1 {
          font-size: clamp(2.4rem, 6vw, 4.4rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: var(--tkd-white);
          margin-bottom: 10px;
        }

        .tkd-hero-h1 span.tkd-accent-red {
          color: var(--tkd-red);
        }

        .tkd-hero-h1 span.tkd-accent-blue {
          color: #5dade2;
        }

        .tkd-hero-sub {
          font-size: 1rem;
          font-weight: 400;
          color: var(--tkd-muted);
          max-width: 540px;
          line-height: 1.6;
          margin-bottom: 36px;
        }

        /* Hero layout: text + SVG side by side */
        .tkd-hero-layout {
          display: flex;
          align-items: flex-start;
          gap: 40px;
        }

        .tkd-hero-text {
          flex: 1;
          min-width: 0;
        }

        .tkd-hero-svg-wrap {
          flex-shrink: 0;
          width: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.88;
        }

        @media (max-width: 700px) {
          .tkd-hero-layout { flex-direction: column; }
          .tkd-hero-svg-wrap { width: 160px; align-self: center; }
        }

        /* Key stats grid */
        .tkd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 48px;
          animation: tkd-fade-up 0.55s 0.08s ease both;
        }

        @media (max-width: 700px) {
          .tkd-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .tkd-stat-card {
          background: var(--tkd-surface);
          border: 1px solid var(--tkd-border-red);
          border-radius: 10px;
          padding: 20px 16px;
          text-align: center;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .tkd-stat-card:hover {
          border-color: var(--tkd-red);
          background: var(--tkd-surface-2);
        }

        .tkd-stat-value {
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--tkd-red);
          line-height: 1.1;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .tkd-stat-value.blue {
          color: #5dade2;
        }

        .tkd-stat-value.gold {
          color: var(--tkd-gold);
        }

        .tkd-stat-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--tkd-muted);
        }

        /* Chart section */
        .tkd-chart-section {
          margin-bottom: 48px;
          animation: tkd-fade-up 0.55s 0.12s ease both;
        }

        .tkd-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--tkd-muted);
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tkd-section-title::before {
          content: '';
          display: block;
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, var(--tkd-red), var(--tkd-blue));
          flex-shrink: 0;
        }

        .tkd-chart-card {
          background: var(--tkd-surface);
          border: 1px solid var(--tkd-border-red);
          border-radius: 14px;
          padding: 28px 24px;
        }

        .tkd-chart-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--tkd-white);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }

        .tkd-bar-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .tkd-bar-row:last-child {
          margin-bottom: 0;
        }

        .tkd-bar-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--tkd-white);
          width: 110px;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .tkd-bar-track {
          flex: 1;
          height: 22px;
          background: rgba(255,255,255,0.04);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .tkd-bar-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          transition: width 0.6s ease;
        }

        .tkd-bar-fill.tkd-bar-red {
          background: linear-gradient(90deg, rgba(192,57,43,0.5), var(--tkd-red));
        }

        .tkd-bar-fill.tkd-bar-blue {
          background: linear-gradient(90deg, rgba(26,82,118,0.5), #2e86c1);
        }

        .tkd-bar-fill.tkd-bar-mid {
          background: linear-gradient(90deg, rgba(120,40,35,0.5), #922b21);
        }

        .tkd-bar-value {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        /* Science cards grid */
        .tkd-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          animation: tkd-fade-up 0.55s 0.16s ease both;
        }

        @media (max-width: 750px) {
          .tkd-cards-grid { grid-template-columns: 1fr; }
        }

        .tkd-sci-card {
          background: var(--tkd-surface);
          border-radius: 14px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .tkd-sci-card.border-red {
          border: 1px solid var(--tkd-border-red);
        }

        .tkd-sci-card.border-blue {
          border: 1px solid var(--tkd-border-blue);
        }

        .tkd-sci-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .tkd-sci-card-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .tkd-sci-card-icon.red {
          background: var(--tkd-red-glow);
          border: 1px solid var(--tkd-border-red);
          color: var(--tkd-red);
        }

        .tkd-sci-card-icon.blue {
          background: var(--tkd-blue-glow);
          border: 1px solid var(--tkd-border-blue);
          color: #5dade2;
        }

        .tkd-sci-card-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--tkd-white);
          letter-spacing: 0.02em;
        }

        .tkd-sci-row {
          padding: 13px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .tkd-sci-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .tkd-sci-stat {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--tkd-white);
          margin-bottom: 5px;
          line-height: 1.35;
          letter-spacing: 0.01em;
        }

        .tkd-sci-detail {
          font-size: 0.72rem;
          font-weight: 400;
          color: var(--tkd-muted);
          line-height: 1.6;
        }

        /* Taegeuk info banner */
        .tkd-flag-banner {
          background: var(--tkd-surface);
          border: 1px solid rgba(243,156,18,0.2);
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          animation: tkd-fade-up 0.55s 0.2s ease both;
        }

        .tkd-flag-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
        }

        .tkd-flag-text-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--tkd-gold);
          margin-bottom: 3px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tkd-flag-text-body {
          font-size: 0.72rem;
          color: var(--tkd-muted);
          line-height: 1.55;
        }

        /* Animation */
        @keyframes tkd-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}} />

      <div className="tkd-root">

        {/* Header */}
        <header className="tkd-header">
          <div className="tkd-header-inner">
            <Link href="/" className="tkd-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="tkd-header-label">Olympic Combat Sport</div>
              <div className="tkd-header-title">Taekwondo Science</div>
            </div>
          </div>
        </header>

        <main className="tkd-main">

          {/* Hero */}
          <section className="tkd-hero">
            <div className="tkd-hero-bg" />
            <div className="tkd-hero-stripe" />

            <div className="tkd-hero-layout">
              <div className="tkd-hero-text">
                <div className="tkd-hero-tag">Sport Science</div>
                <h1 className="tkd-hero-h1">
                  <span className="tkd-accent-red">태권도</span><br />
                  <span className="tkd-accent-blue">Taekwondo</span>
                </h1>
                <p className="tkd-hero-sub">
                  The science of kicking velocity, explosive biomechanics, Olympic competition physiology, and elite mental performance in Korea&apos;s national sport and Olympic discipline.
                </p>
              </div>

              {/* Hero SVG: taekwondo athlete in flying kick + taegeuk decorative element */}
              <div className="tkd-hero-svg-wrap">
                <svg viewBox="0 0 220 280" width="220" height="280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Taekwondo athlete in flying kick">

                  {/* Taegeuk circle decoration */}
                  <circle cx="110" cy="110" r="90" stroke="rgba(192,57,43,0.12)" strokeWidth="1.5" fill="none" />
                  <circle cx="110" cy="110" r="70" stroke="rgba(26,82,118,0.10)" strokeWidth="1" fill="none" />

                  {/* Taegeuk yin-yang inspired symbol (simplified decorative) */}
                  <path d="M 110 38 A 72 72 0 0 1 110 182 A 36 36 0 0 0 110 110 A 36 36 0 0 1 110 38 Z"
                        fill="rgba(192,57,43,0.15)" />
                  <path d="M 110 38 A 72 72 0 0 0 110 182 A 36 36 0 0 1 110 110 A 36 36 0 0 0 110 38 Z"
                        fill="rgba(26,82,118,0.15)" />
                  <circle cx="110" cy="74" r="18" fill="rgba(192,57,43,0.20)" />
                  <circle cx="110" cy="146" r="18" fill="rgba(26,82,118,0.20)" />
                  <circle cx="110" cy="110" r="72" stroke="rgba(192,57,43,0.20)" strokeWidth="1.5" fill="none" />

                  {/* Athlete silhouette — flying side kick (yeop chagi in air) */}
                  {/* Head */}
                  <circle cx="150" cy="72" r="13" fill="rgba(248,249,250,0.75)" />
                  {/* Neck */}
                  <rect x="146" y="84" width="8" height="10" rx="3" fill="rgba(248,249,250,0.65)" />
                  {/* Torso — angled forward for flying kick */}
                  <path d="M 142 94 L 118 108 L 122 136 L 148 130 Z"
                        fill="rgba(192,57,43,0.80)" />
                  {/* Dobok (uniform) collar detail */}
                  <path d="M 142 94 L 135 104 L 128 100 L 133 94 Z" fill="rgba(248,249,250,0.25)" />
                  {/* Belt stripe on torso */}
                  <line x1="122" y1="124" x2="148" y2="118" stroke="var(--tkd-gold)" strokeWidth="2.5" opacity="0.7" />

                  {/* Left arm — chambered back (power generation) */}
                  <path d="M 145 100 Q 162 92 168 82" stroke="rgba(248,249,250,0.70)" strokeWidth="7" strokeLinecap="round" fill="none" />
                  {/* Right arm — guard position */}
                  <path d="M 120 100 Q 108 108 102 104" stroke="rgba(248,249,250,0.60)" strokeWidth="6" strokeLinecap="round" fill="none" />
                  {/* Right fist */}
                  <circle cx="100" cy="103" r="5" fill="rgba(248,249,250,0.60)" />

                  {/* Chamber leg (right, tucked) */}
                  <path d="M 122 136 Q 110 148 104 160 Q 98 172 102 178"
                        stroke="rgba(248,249,250,0.55)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  {/* Right foot (tucked) */}
                  <ellipse cx="102" cy="180" rx="9" ry="5" fill="rgba(248,249,250,0.50)" />

                  {/* Kicking leg (left — extended fully for flying side kick) */}
                  <path d="M 128 132 Q 104 138 80 130 Q 62 124 52 118"
                        stroke="rgba(248,249,250,0.85)" strokeWidth="10" strokeLinecap="round" fill="none" />
                  {/* Foot/heel of kick */}
                  <path d="M 52 118 L 38 124 L 44 132 L 56 126 Z"
                        fill="rgba(248,249,250,0.90)" />
                  {/* Impact flash lines */}
                  <line x1="36" y1="118" x2="22" y2="112" stroke="var(--tkd-red)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                  <line x1="34" y1="126" x2="20" y2="126" stroke="var(--tkd-red)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <line x1="38" y1="133" x2="26" y2="140" stroke="var(--tkd-red)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

                  {/* Speed motion lines behind athlete */}
                  <line x1="160" y1="155" x2="195" y2="148" stroke="rgba(26,82,118,0.35)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="158" y1="164" x2="198" y2="162" stroke="rgba(26,82,118,0.25)" strokeWidth="1" strokeLinecap="round" />
                  <line x1="160" y1="173" x2="194" y2="176" stroke="rgba(26,82,118,0.20)" strokeWidth="1" strokeLinecap="round" />

                  {/* Olympic rings hint (subtle, small) */}
                  <g opacity="0.30" transform="translate(76, 230)">
                    <circle cx="0"  cy="6" r="6" stroke="var(--tkd-blue)"  strokeWidth="1.5" fill="none" />
                    <circle cx="14" cy="6" r="6" stroke="var(--tkd-red)"   strokeWidth="1.5" fill="none" />
                    <circle cx="28" cy="6" r="6" stroke="rgba(248,249,250,0.7)" strokeWidth="1.5" fill="none" />
                    <circle cx="7"  cy="13" r="6" stroke="var(--tkd-gold)"  strokeWidth="1.5" fill="none" />
                    <circle cx="21" cy="13" r="6" stroke="rgba(26,130,80,0.8)" strokeWidth="1.5" fill="none" />
                  </g>
                </svg>
              </div>
            </div>
          </section>

          {/* Key stats grid */}
          <div className="tkd-stats-grid">
            <div className="tkd-stat-card">
              <div className="tkd-stat-value">14–16 m/s</div>
              <div className="tkd-stat-label">Back Kick Speed</div>
            </div>
            <div className="tkd-stat-card">
              <div className="tkd-stat-value blue">80 ms</div>
              <div className="tkd-stat-label">Counter-attack RT</div>
            </div>
            <div className="tkd-stat-card">
              <div className="tkd-stat-value">85–95%</div>
              <div className="tkd-stat-label">Match HRmax</div>
            </div>
            <div className="tkd-stat-card">
              <div className="tkd-stat-value gold">170–190°</div>
              <div className="tkd-stat-label">Hip Rotation Range</div>
            </div>
          </div>

          {/* Taegeuk / Olympic origin banner */}
          <div className="tkd-flag-banner">
            <svg className="tkd-flag-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Taegeuk symbol">
              <circle cx="22" cy="22" r="20" stroke="rgba(243,156,18,0.4)" strokeWidth="1.5" fill="rgba(243,156,18,0.05)" />
              <path d="M 22 4 A 18 18 0 0 1 22 40 A 9 9 0 0 0 22 22 A 9 9 0 0 1 22 4 Z" fill="rgba(192,57,43,0.45)" />
              <path d="M 22 4 A 18 18 0 0 0 22 40 A 9 9 0 0 1 22 22 A 9 9 0 0 0 22 4 Z" fill="rgba(26,82,118,0.45)" />
              <circle cx="22" cy="13" r="4.5" fill="rgba(192,57,43,0.55)" />
              <circle cx="22" cy="31" r="4.5" fill="rgba(26,82,118,0.55)" />
            </svg>
            <div>
              <div className="tkd-flag-text-title">Olympic Sport since 2000 (Sydney) — Poomsae added Paris 2024</div>
              <div className="tkd-flag-text-body">Taekwondo (태권도) is Korea&apos;s national sport and a full Olympic discipline. Two branches compete at Olympic level: kyorugi (sparring, since 2000) and poomsae (forms, debuted 2024). Governed by World Taekwondo (WT), distinct from ITF. Approximately 80 million practitioners in 210+ countries.</div>
            </div>
          </div>

          {/* Kick Force Chart */}
          <section className="tkd-chart-section">
            <div className="tkd-section-title">Biomechanical Data</div>
            <div className="tkd-chart-card">
              <div className="tkd-chart-title">Kick Force by Technique (Peak Newtons)</div>

              {/* Back Kick: 5900 N — max = 6000 N scale */}
              <div className="tkd-bar-row">
                <div className="tkd-bar-label">Back Kick</div>
                <div className="tkd-bar-track">
                  <div className="tkd-bar-fill tkd-bar-red" style={{width: '98.3%'}}>
                    <span className="tkd-bar-value">5,900 N</span>
                  </div>
                </div>
              </div>

              {/* Turning Kick: 4900 N */}
              <div className="tkd-bar-row">
                <div className="tkd-bar-label">Turning Kick</div>
                <div className="tkd-bar-track">
                  <div className="tkd-bar-fill tkd-bar-red" style={{width: '81.7%'}}>
                    <span className="tkd-bar-value">4,900 N</span>
                  </div>
                </div>
              </div>

              {/* Side Kick: 4200 N */}
              <div className="tkd-bar-row">
                <div className="tkd-bar-label">Side Kick</div>
                <div className="tkd-bar-track">
                  <div className="tkd-bar-fill tkd-bar-blue" style={{width: '70.0%'}}>
                    <span className="tkd-bar-value">4,200 N</span>
                  </div>
                </div>
              </div>

              {/* Front Kick: 3800 N */}
              <div className="tkd-bar-row">
                <div className="tkd-bar-label">Front Kick</div>
                <div className="tkd-bar-track">
                  <div className="tkd-bar-fill tkd-bar-blue" style={{width: '63.3%'}}>
                    <span className="tkd-bar-value">3,800 N</span>
                  </div>
                </div>
              </div>

              {/* Axe Kick: 3200 N */}
              <div className="tkd-bar-row">
                <div className="tkd-bar-label">Axe Kick</div>
                <div className="tkd-bar-track">
                  <div className="tkd-bar-fill tkd-bar-mid" style={{width: '53.3%'}}>
                    <span className="tkd-bar-value">3,200 N</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Science cards */}
          <section>
            <div className="tkd-section-title">Science Breakdown</div>
            <div className="tkd-cards-grid">

              {/* Card 1: Kicking Biomechanics */}
              <div className="tkd-sci-card border-red">
                <div className="tkd-sci-card-header">
                  <div className="tkd-sci-card-icon red">⚡</div>
                  <div className="tkd-sci-card-title">Kicking Biomechanics</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Turning kick: 4,200–5,600 N, foot velocity 12–14 m/s</div>
                  <div className="tkd-sci-detail">Estevan 2013 (TKD biomechanics): rear-leg turning kick (dollyo chagi) at world championship level. Hip abduction → external hip rotation → knee extension → ankle plantarflexion kinetic chain. Hip rotation angular velocity: 800–1,200°/s as primary force generator. World champion athletes generate 25% higher peak force than national-level competitors through superior hip rotation mechanics.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Back kick: highest linear kick velocity, 14–16 m/s</div>
                  <div className="tkd-sci-detail">Mechanically strongest TKD kick: rear leg back kick (dwi chagi) utilising full hip extension. Foot velocity 14–16 m/s; peak force potential 5,000–6,800 N. Rarely used in competition due to visual telegraph — primarily used as counter technique when opponent rushes forward.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Spinning heel kick (dwi hurigi): 540° rotation in 0.4 s</div>
                  <div className="tkd-sci-detail">Complex spinning technique: 360° body rotation + 180° heel arc. Angular momentum conservation, visual target tracking during rotation, timing of heel strike at maximum angular velocity. Increasingly used at elite level as surprise attack. Biomechanical study: Pearson 2001.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Jump kicks: 60+ cm height adds 2–3 m/s foot velocity</div>
                  <div className="tkd-sci-detail">Aerial kick mechanics: jump height contributing additional gravitational potential converted to rotational velocity. Jump turning kick (twie dollyo chagi): elite male athletes achieve 75–90 cm jump height, adding 2.5–3.5 m/s foot velocity at impact. Olympic scoring system values jump kicks +1 point for spinning, +2 for jumping.</div>
                </div>
              </div>

              {/* Card 2: Competition Science & Scoring */}
              <div className="tkd-sci-card border-blue">
                <div className="tkd-sci-card-header">
                  <div className="tkd-sci-card-icon blue">🏆</div>
                  <div className="tkd-sci-card-title">Competition Science &amp; Scoring</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Reaction time: 80–120 ms kick initiation to counter-attack</div>
                  <div className="tkd-sci-detail">TKD-specific reaction time demands: defensive-to-offensive transition. Expert TKD athletes initiate counter-kick 80–120 ms after detecting opponent kick — comparable to badminton and tennis reaction demands. Anticipation from trunk lean and hip initiation cues: 200–250 ms advance warning available to trained observer. Falco 2009.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Electronic scoring: 48–50 N threshold at trunk protector</div>
                  <div className="tkd-sci-detail">World Taekwondo (WT) electronic scoring system: trunk protector sensors require 48–50 N to register point. Kick force at competition: 200–600 N average, well above threshold but variable with angle and contact area. Calibration issues: sensor face vs. side impacts. Head kick: manual judging + sensor.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Match intensity: 85–95% HRmax, blood lactate 8–12 mmol/L</div>
                  <div className="tkd-sci-detail">Heller 1998 (TKD competition physiology): Olympic-format matches (3 × 2 min rounds) generate HR 85–95% HRmax and post-match lactate 8–12 mmol/L. Aerobic and anaerobic systems both critical. VO₂max: 55–65 mL/kg/min for Olympic-level competitors. Significant rest (1 min between rounds) insufficient for full lactate clearance.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Weight categories: 8 divisions from –49 kg to +80 kg</div>
                  <div className="tkd-sci-detail">Weight management science in TKD: 30–40% of competitors cut weight before competition. Acute dehydration for weigh-in → rapid rehydration. Performance implications similar to judo and wrestling weight cutting research. Same-day weigh-in (WT rule change 2017) has partially reduced extreme cutting.</div>
                </div>
              </div>

              {/* Card 3: Physical Conditioning */}
              <div className="tkd-sci-card border-red">
                <div className="tkd-sci-card-header">
                  <div className="tkd-sci-card-icon red">❤️</div>
                  <div className="tkd-sci-card-title">Physical Conditioning</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Flexibility: 170–190° hip external rotation range elite</div>
                  <div className="tkd-sci-detail">Hip flexibility requirements for head-height kicks, dynamic flexibility vs. static flexibility distinction, PNF stretching for kick amplitude, hip flexor length for chamber height. Research: Kazemi 2005 (TKD athlete profiling).</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Speed training: kicking combinations at 6–8 kicks/second</div>
                  <div className="tkd-sci-detail">High-speed combination sequences (3–5 kick combinations in &lt;1 s), reaction training devices, speed bag equivalents in TKD (kick target pads), partner reaction training. Neural adaptation: 8-week speed training improved kick speed 12–15% in RCT.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Strength asymmetry: 10–15% dominant vs. non-dominant leg</div>
                  <div className="tkd-sci-detail">Kick force asymmetry between preferred and non-preferred leg in TKD athletes. Training implications: bilateral strength training to reduce asymmetry, non-preferred leg technical development, competition strategy for disguising non-preferred leg.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Injury prevention: ankle and knee most common (25–35%)</div>
                  <div className="tkd-sci-detail">Ankle sprains (22–28%) and knee ligament injuries (12–18%) dominate TKD injury profile. Falls from failed jump kicks. Head and face injuries: 15–20% despite helmet; ear injury from head kicks. Groin strain: 8–12% from extreme hip abduction kicks.</div>
                </div>
              </div>

              {/* Card 4: Mental Performance & Training */}
              <div className="tkd-sci-card border-blue">
                <div className="tkd-sci-card-header">
                  <div className="tkd-sci-card-icon blue">🧠</div>
                  <div className="tkd-sci-card-title">Mental Performance &amp; Training</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Poomsae (forms): precision-focused branch, different psychology</div>
                  <div className="tkd-sci-detail">TKD poomsae (Olympic sport since Paris 2024): predetermined movement sequences judged on accuracy, power, and rhythm. Different mental demands from sparring — motor programme execution vs. reactive combat. EEG research shows different neural activation patterns.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Pre-competition routine: 20–30 min warm-up essential for explosive performance</div>
                  <div className="tkd-sci-detail">Neuromuscular warm-up for TKD: dynamic hip mobility, progressive kicking speed, pad work, sprint activations. Cold muscle: maximum kick speed 15–20% reduced vs. fully warmed. Competition environment warm-up area management.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Decision-making training: scenario-based defensive/offensive drills</div>
                  <div className="tkd-sci-detail">Video-based anticipation training (opponent body position → predict attack type) improves counter-attack timing 15–20% in 6-week intervention. Pattern recognition library development through systematic sparring analysis.</div>
                </div>

                <div className="tkd-sci-row">
                  <div className="tkd-sci-stat">Elite development: average age of world championship medals: 22–26</div>
                  <div className="tkd-sci-detail">Career trajectory in TKD: peak competition age 20–28, with some extending to 30+. Early development: poomsae base at 8–14, competitive sparring 14+. Korean national programme: dedicated training centres from age 15. Long-term athlete development frameworks.</div>
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>
    </>
  )
}
