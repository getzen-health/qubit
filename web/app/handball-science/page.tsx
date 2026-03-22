import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Handball Science | KQuarks' }

export default function HandballSciencePage() {
  const chartData = [
    { label: 'Jump Shot', value: 98, pct: 100, colorA: '#ffd60a', colorB: '#e63946' },
    { label: 'Penalty (7m)', value: 90, pct: 92, colorA: '#e63946', colorB: '#ffd60a' },
    { label: 'Compound Shot', value: 85, pct: 87, colorA: '#ffd60a', colorB: '#e63946' },
    { label: 'Standing Throw', value: 70, pct: 71, colorA: '#e63946', colorB: '#ffd60a' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root {
          --hb-navy: #0d1b2a;
          --hb-yellow: #ffd60a;
          --hb-red: #e63946;
          --hb-text: #f0f4f8;
          --hb-dark: #060f18;
          --hb-surface: #0f1e2e;
          --hb-surface-2: #142333;
          --hb-border: #1a2d40;
          --hb-border-mid: #224058;
          --hb-yellow-glow: rgba(255, 214, 10, 0.12);
          --hb-yellow-glow-lg: rgba(255, 214, 10, 0.06);
          --hb-red-glow: rgba(230, 57, 70, 0.12);
          --hb-red-glow-lg: rgba(230, 57, 70, 0.06);
          --hb-text-dim: #7a96af;
          --hb-text-faint: #1e3349;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hb-root {
          min-height: 100vh;
          background-color: var(--hb-dark);
          color: var(--hb-text);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .hb-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Court floor radial glow */
        .hb-root::after {
          content: '';
          position: fixed;
          top: -30vh;
          left: 50%;
          transform: translateX(-50%);
          width: 200vw;
          height: 70vh;
          background: radial-gradient(ellipse at top, rgba(255, 214, 10, 0.04) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .hb-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(6, 15, 24, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--hb-border);
        }

        .hb-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 13px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .hb-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--hb-surface);
          border: 1px solid var(--hb-border);
          color: var(--hb-text-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .hb-back-btn:hover {
          background: var(--hb-surface-2);
          border-color: var(--hb-yellow);
          color: var(--hb-yellow);
        }

        .hb-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--hb-yellow);
          opacity: 0.7;
        }

        .hb-header-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.06em;
          color: var(--hb-text);
          text-transform: uppercase;
        }

        /* Main */
        .hb-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .hb-hero {
          position: relative;
          padding: 80px 0 64px;
          overflow: hidden;
          animation: hb-fade-up 0.6s ease both;
        }

        @keyframes hb-fade-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes hb-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes hb-bar-grow {
          from { width: 0; }
        }

        @keyframes hb-stripe-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Diagonal speed stripes in hero bg */
        .hb-hero-stripes {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .hb-hero-stripe {
          position: absolute;
          top: 0; bottom: 0;
          width: 2px;
          background: var(--hb-yellow);
          opacity: 0.04;
          transform: skewX(-20deg);
        }

        .hb-hero-stripe:nth-child(1) { left: 10%; }
        .hb-hero-stripe:nth-child(2) { left: 25%; }
        .hb-hero-stripe:nth-child(3) { left: 40%; }
        .hb-hero-stripe:nth-child(4) { left: 55%; }
        .hb-hero-stripe:nth-child(5) { left: 70%; }
        .hb-hero-stripe:nth-child(6) { left: 85%; }

        /* Glow blob */
        .hb-hero-glow {
          position: absolute;
          top: -80px;
          right: -60px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 214, 10, 0.07) 0%, rgba(230, 57, 70, 0.04) 50%, transparent 70%);
          pointer-events: none;
          animation: hb-glow-pulse 5s ease-in-out infinite;
        }

        .hb-hero-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--hb-yellow);
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hb-hero-tag::before {
          content: '';
          display: block;
          width: 36px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--hb-yellow));
        }

        .hb-hero-h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(56px, 10vw, 116px);
          line-height: 0.88;
          letter-spacing: -0.01em;
          font-weight: 900;
          font-style: italic;
          text-transform: uppercase;
          color: var(--hb-text);
          margin-bottom: 10px;
        }

        .hb-hero-h1 .accent-yellow {
          color: var(--hb-yellow);
          display: block;
          text-shadow: 0 0 60px rgba(255, 214, 10, 0.3);
        }

        .hb-hero-h1 .accent-outline {
          -webkit-text-stroke: 1px var(--hb-red);
          color: transparent;
          display: block;
        }

        .hb-hero-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(16px, 2.5vw, 22px);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--hb-text-dim);
          margin-top: 22px;
          max-width: 620px;
          line-height: 1.35;
        }

        /* Waveform viz */
        .hb-wave-viz {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 32px;
          margin: 20px 0;
        }

        .hb-wave-bar {
          flex: 1;
          border-radius: 1px 1px 0 0;
          animation: hb-glow-pulse 2.2s ease-in-out infinite;
        }

        .hb-wave-bar:nth-child(odd) {
          background: linear-gradient(to top, var(--hb-yellow), rgba(255,214,10,0.3));
          opacity: 0.4;
        }
        .hb-wave-bar:nth-child(even) {
          background: linear-gradient(to top, var(--hb-red), rgba(230,57,70,0.3));
          opacity: 0.3;
        }
        .hb-wave-bar:nth-child(3n) { animation-delay: 0.2s; opacity: 0.7; }
        .hb-wave-bar:nth-child(5n) { animation-delay: 0.4s; opacity: 0.6; }
        .hb-wave-bar:nth-child(7n) { animation-delay: 0.1s; opacity: 0.9; }

        /* Key stats grid */
        .hb-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 48px;
          animation: hb-fade-up 0.5s ease 0.1s both;
        }

        @media (max-width: 640px) {
          .hb-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .hb-stat-tile {
          background: var(--hb-surface);
          border: 1px solid var(--hb-border);
          padding: 24px 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .hb-stat-tile::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .hb-stat-tile.c1::before { background: var(--hb-yellow); }
        .hb-stat-tile.c2::before { background: var(--hb-red); }
        .hb-stat-tile.c3::before { background: var(--hb-yellow); }
        .hb-stat-tile.c4::before { background: var(--hb-red); }

        .hb-stat-tile:hover {
          border-color: var(--hb-border-mid);
        }

        .hb-stat-num {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 36px;
          font-weight: 900;
          font-style: italic;
          line-height: 1;
        }

        .hb-stat-tile.c1 .hb-stat-num { color: var(--hb-yellow); }
        .hb-stat-tile.c2 .hb-stat-num { color: var(--hb-red); }
        .hb-stat-tile.c3 .hb-stat-num { color: var(--hb-yellow); }
        .hb-stat-tile.c4 .hb-stat-num { color: var(--hb-red); }

        .hb-stat-unit {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--hb-text-dim);
          margin-top: 2px;
        }

        .hb-stat-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--hb-text-dim);
          margin-top: 8px;
        }

        .hb-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--hb-text-faint);
          margin-top: 4px;
          letter-spacing: 0.04em;
        }

        /* Section label */
        .hb-section-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--hb-text-dim);
          margin: 48px 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hb-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--hb-border);
        }

        /* Chart section */
        .hb-chart-wrap {
          background: var(--hb-surface);
          border: 1px solid var(--hb-border);
          padding: 32px;
          margin-bottom: 2px;
          animation: hb-fade-up 0.5s ease 0.15s both;
          position: relative;
          overflow: hidden;
        }

        .hb-chart-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--hb-yellow), var(--hb-red));
        }

        .hb-chart-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--hb-text);
          margin-bottom: 6px;
        }

        .hb-chart-sub {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          color: var(--hb-text-dim);
          margin-bottom: 28px;
        }

        .hb-chart-rows {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hb-chart-row {
          display: grid;
          grid-template-columns: 160px 1fr 72px;
          align-items: center;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .hb-chart-row {
            grid-template-columns: 120px 1fr 52px;
            gap: 8px;
          }
        }

        .hb-chart-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--hb-text-dim);
          text-align: right;
        }

        .hb-chart-track {
          height: 32px;
          background: var(--hb-surface-2);
          border: 1px solid var(--hb-border);
          position: relative;
          overflow: hidden;
        }

        .hb-chart-bar {
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: hb-bar-grow 1s ease 0.3s both;
          display: flex;
          align-items: center;
          padding-left: 10px;
        }

        .hb-chart-inner-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          white-space: nowrap;
        }

        .hb-chart-kmh {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 16px;
          font-weight: 800;
          font-style: italic;
          color: var(--hb-text);
          text-align: right;
        }

        /* Science cards grid */
        .hb-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
        }

        @media (max-width: 640px) {
          .hb-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .hb-card {
          background: var(--hb-surface);
          border: 1px solid var(--hb-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: hb-fade-up 0.5s ease both;
        }

        .hb-card:nth-child(1) { animation-delay: 0.0s; }
        .hb-card:nth-child(2) { animation-delay: 0.07s; }
        .hb-card:nth-child(3) { animation-delay: 0.14s; }
        .hb-card:nth-child(4) { animation-delay: 0.21s; }

        .hb-card:hover { border-color: var(--hb-border-mid); }

        .hb-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }

        .hb-card.yellow::before { background: var(--hb-yellow); }
        .hb-card.red::before { background: var(--hb-red); }
        .hb-card.yellow-red::before { background: linear-gradient(90deg, var(--hb-yellow), var(--hb-red)); }
        .hb-card.red-yellow::before { background: linear-gradient(90deg, var(--hb-red), var(--hb-yellow)); }

        .hb-card.yellow:hover { box-shadow: inset 0 0 80px var(--hb-yellow-glow-lg); }
        .hb-card.red:hover { box-shadow: inset 0 0 80px var(--hb-red-glow-lg); }
        .hb-card.yellow-red:hover { box-shadow: inset 0 0 80px var(--hb-yellow-glow-lg); }
        .hb-card.red-yellow:hover { box-shadow: inset 0 0 80px var(--hb-red-glow-lg); }

        .hb-card-glow-orb {
          position: absolute;
          top: 0; right: 0;
          width: 180px; height: 180px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .hb-card.yellow .hb-card-glow-orb { background: var(--hb-yellow-glow); }
        .hb-card.red .hb-card-glow-orb { background: var(--hb-red-glow); }
        .hb-card.yellow-red .hb-card-glow-orb { background: var(--hb-yellow-glow); }
        .hb-card.red-yellow .hb-card-glow-orb { background: var(--hb-red-glow); }

        .hb-card-num {
          font-family: 'Barlow Condensed', sans-serif;
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

        .hb-card.yellow .hb-card-num { color: var(--hb-yellow); }
        .hb-card.red .hb-card-num { color: var(--hb-red); }
        .hb-card.yellow-red .hb-card-num { color: var(--hb-yellow); }
        .hb-card.red-yellow .hb-card-num { color: var(--hb-red); }

        .hb-card-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .hb-card-icon {
          width: 34px; height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .hb-card.yellow .hb-card-icon { background: var(--hb-yellow-glow); }
        .hb-card.red .hb-card-icon { background: var(--hb-red-glow); }
        .hb-card.yellow-red .hb-card-icon { background: var(--hb-yellow-glow); }
        .hb-card.red-yellow .hb-card-icon { background: var(--hb-red-glow); }

        .hb-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .hb-card.yellow .hb-card-kicker { color: var(--hb-yellow); }
        .hb-card.red .hb-card-kicker { color: var(--hb-red); }
        .hb-card.yellow-red .hb-card-kicker { color: var(--hb-yellow); }
        .hb-card.red-yellow .hb-card-kicker { color: var(--hb-red); }

        .hb-card-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px;
          font-weight: 800;
          font-style: italic;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--hb-text);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .hb-card-findings {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hb-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.018);
          border-left: 2px solid var(--hb-border);
          transition: all 0.15s ease;
        }

        .hb-finding:hover {
          background: rgba(255,255,255,0.034);
        }

        .hb-card.yellow .hb-finding:hover { border-left-color: rgba(255,214,10,0.5); }
        .hb-card.red .hb-finding:hover { border-left-color: rgba(230,57,70,0.5); }
        .hb-card.yellow-red .hb-finding:hover { border-left-color: rgba(255,214,10,0.5); }
        .hb-card.red-yellow .hb-finding:hover { border-left-color: rgba(230,57,70,0.5); }

        .hb-finding-stat {
          flex-shrink: 0;
          min-width: 84px;
        }

        .hb-finding-stat-val {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 19px;
          font-weight: 800;
          font-style: italic;
          line-height: 1;
          white-space: nowrap;
        }

        .hb-card.yellow .hb-finding-stat-val { color: var(--hb-yellow); }
        .hb-card.red .hb-finding-stat-val { color: var(--hb-red); }
        .hb-card.yellow-red .hb-finding-stat-val { color: var(--hb-yellow); }
        .hb-card.red-yellow .hb-finding-stat-val { color: var(--hb-red); }

        .hb-finding-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--hb-text-dim);
          margin-top: 2px;
          letter-spacing: 0.04em;
        }

        .hb-finding-body { flex: 1; }

        .hb-finding-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--hb-text);
          margin-bottom: 3px;
        }

        .hb-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--hb-text-dim);
          line-height: 1.45;
        }

        /* Disclaimer */
        .hb-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--hb-surface);
          border: 1px solid var(--hb-border);
          border-left: 3px solid var(--hb-border-mid);
        }

        .hb-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--hb-text-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .hb-hero { padding: 56px 0 48px; }
          .hb-card { padding: 24px 18px; }
          .hb-chart-wrap { padding: 24px 18px; }
          .hb-hero-h1 { font-size: 54px; }
          .hb-chart-label { font-size: 11px; }
        }
      `}} />

      <div className="hb-root">
        {/* Header */}
        <header className="hb-header">
          <div className="hb-header-inner">
            <Link href="/workouts" className="hb-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="hb-header-label">Sports Science Series</div>
              <div className="hb-header-title">Handball Science</div>
            </div>
          </div>
        </header>

        <main className="hb-main">
          {/* Hero */}
          <section className="hb-hero">
            <div className="hb-hero-stripes" aria-hidden="true">
              <div className="hb-hero-stripe" />
              <div className="hb-hero-stripe" />
              <div className="hb-hero-stripe" />
              <div className="hb-hero-stripe" />
              <div className="hb-hero-stripe" />
              <div className="hb-hero-stripe" />
            </div>
            <div className="hb-hero-glow" aria-hidden="true" />

            <div className="hb-hero-tag">High-Intensity Court Combat Sport</div>

            <h1 className="hb-hero-h1">
              <span>HANDBALL</span>
              <span className="accent-yellow">POWER</span>
              <span className="accent-outline">&amp; SCIENCE</span>
            </h1>

            <p className="hb-hero-sub">
              Throwing biomechanics, goalkeeper reaction science, and elite periodisation behind the world&apos;s premier indoor team sport. Evidence-based performance research.
            </p>

            <div className="hb-wave-viz" aria-hidden="true">
              {[4,2,7,3,9,2,6,4,10,2,5,3,8,2,7,4,9,3,6,2,8,3,5,4].map((h, i) => (
                <div key={i} className="hb-wave-bar" style={{height: `${h * 10}%`}} />
              ))}
            </div>
          </section>

          {/* Key Stats Grid */}
          <div className="hb-section-title">Key Statistics</div>
          <div className="hb-stats-grid">
            <div className="hb-stat-tile c1">
              <div className="hb-stat-num">5–8 km</div>
              <div className="hb-stat-unit">per match</div>
              <div className="hb-stat-label">Distance Covered</div>
              <div className="hb-stat-ref">Povoas 2012</div>
            </div>
            <div className="hb-stat-tile c2">
              <div className="hb-stat-num">85–110</div>
              <div className="hb-stat-unit">km/h</div>
              <div className="hb-stat-label">Jump Shot Release Speed</div>
              <div className="hb-stat-ref">Van den Tillaar 2004</div>
            </div>
            <div className="hb-stat-tile c3">
              <div className="hb-stat-num">78–85%</div>
              <div className="hb-stat-unit">conversion</div>
              <div className="hb-stat-label">Fast Break Success Rate</div>
              <div className="hb-stat-ref">Taborsky 2011</div>
            </div>
            <div className="hb-stat-tile c4">
              <div className="hb-stat-num">40–55%</div>
              <div className="hb-stat-unit">of all injuries</div>
              <div className="hb-stat-label">Shoulder Injury Share</div>
              <div className="hb-stat-ref">Edouard 2015</div>
            </div>
          </div>

          {/* Chart */}
          <div className="hb-section-title">Ball Speed Comparison</div>
          <div className="hb-chart-wrap">
            <div className="hb-chart-title">Ball Speed by Shot Type</div>
            <div className="hb-chart-sub">Elite male handball — average release velocities by shot category</div>
            <div className="hb-chart-rows">
              {chartData.map((row, i) => (
                <div className="hb-chart-row" key={i}>
                  <div className="hb-chart-label">{row.label}</div>
                  <div className="hb-chart-track">
                    <div
                      className="hb-chart-bar"
                      style={{
                        width: `${row.pct}%`,
                        background: `linear-gradient(90deg, ${row.colorA}33, ${row.colorB}cc)`
                      }}
                    >
                      <span className="hb-chart-inner-val" style={{color: row.colorA}}>{row.value} km/h</span>
                    </div>
                  </div>
                  <div className="hb-chart-kmh" style={{color: row.colorA}}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Science Cards */}
          <div className="hb-section-title">Research Findings</div>
          <div className="hb-cards-grid">

            {/* Card 1: Physical Demands */}
            <div className="hb-card yellow">
              <div className="hb-card-glow-orb" />
              <div className="hb-card-num">01</div>
              <div className="hb-card-top-row">
                <div className="hb-card-icon">🏃</div>
                <div className="hb-card-kicker">Physical Demands</div>
              </div>
              <div className="hb-card-title">Physical Demands &amp; Running Profile</div>
              <div className="hb-card-findings">
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">5–8 km</div>
                    <div className="hb-finding-ref">Povoas 2012</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Elite Match Distance</div>
                    <div className="hb-finding-desc">GPS tracking in Champions League handball: elite players cover 5–8 km per match with 150–200 intense movement changes. High-intensity running above 17 km/h: 1,200–1,800 m per match for backcourt players. Goalkeeper: minimal running but 30–50 high-intensity lateral shuffles and jump-dives per match. Wings most aerobically demanding (highest sprint frequency); pivots most physically demanding from contact events; backcourt players highest absolute sprint distances.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">85–92%</div>
                    <div className="hb-finding-ref">Chelly 2011</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Match Intensity — HRmax Sustained</div>
                    <div className="hb-finding-desc">Heart rate during elite handball matches sustained at 85–92% HRmax, with blood lactate 5–9 mmol/L. VO₂max requirements: backcourt players 55–62 mL/kg/min; wings 58–65 mL/kg/min; goalkeepers 48–55 mL/kg/min. Time-motion profile: 65% aerobic base activities, 35% high-intensity actions. The 60-minute match (two 30-minute halves) with 18 players per side creates continuous high-load demand for first-line players.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">25–40</div>
                    <div className="hb-finding-ref">Michalsik 2013</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">High-Intensity Efforts per Match</div>
                    <div className="hb-finding-desc">Elite handball players complete 25–40 high-intensity efforts per match. Sprint duration: 2–5 s. Acceleration-deceleration patterns: 8–12 maximal acceleration efforts per half. Physical fitness test battery: 30 m sprint &lt;4.0 s, countermovement jump &gt;38 cm, 5-minute run &gt;1,400 m for national team standard.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">40–55%</div>
                    <div className="hb-finding-ref">Edouard 2015</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Shoulder Injury Dominance</div>
                    <div className="hb-finding-desc">EHF injury study: shoulder injuries account for 40–55% of all handball injuries — highest shoulder injury rate of any team sport. Repeated overhead throwing (40–80 throws/training session) creates glenohumeral internal rotation deficit (GIRD) averaging 18–24° in dominant arm. Rotator cuff tendinopathy: 22–30% of elite players. Prevention: pre-season and in-season strengthening of ER/IR ratio (targeting &gt;0.75).</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Throwing Biomechanics */}
            <div className="hb-card red">
              <div className="hb-card-glow-orb" />
              <div className="hb-card-num">02</div>
              <div className="hb-card-top-row">
                <div className="hb-card-icon">⚡</div>
                <div className="hb-card-kicker">Biomechanics</div>
              </div>
              <div className="hb-card-title">Throwing Biomechanics &amp; Ball Speed</div>
              <div className="hb-card-findings">
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">85–110 km/h</div>
                    <div className="hb-finding-ref">Van den Tillaar 2004</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Jump Shot Release Velocity</div>
                    <div className="hb-finding-desc">Elite male handball players achieve ball release velocities of 85–110 km/h (24–31 m/s) for jump shots. Kinetic chain: run-up → jump phase (peak at 50–60 cm height) → shoulder external rotation → shoulder internal rotation → elbow extension → wrist snap. Hip-to-shoulder velocity sequencing contributes 60–65% of total ball speed. Elite female players: 75–90 km/h. Jump shot adds 5–8 km/h through aerial stabilisation.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">3,500–4,800°/s</div>
                    <div className="hb-finding-ref">Wagner 2010</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Shoulder Internal Rotation Velocity</div>
                    <div className="hb-finding-desc">3D biomechanics: handball throwing generates shoulder internal rotation angular velocity of 3,500–4,800°/s — comparable to baseball pitching, with elbow valgus torque reaching 55–70 N·m. Wrist flexion velocity at release: 600–900°/s. Ball grip: the size-3 handball (58–60 cm circumference) allows full hand grip. Rosin use: legal in handball, increases grip friction 15–25%.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">75–85%</div>
                    <div className="hb-finding-ref">Rivilla-Garcia 2011</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Penalty Shot Conversion</div>
                    <div className="hb-finding-desc">Elite handball penalty shots (7m) convert at 75–85%. Goalkeeper save rate: 12–25%. Deception strategies: run-up direction change in final 2 steps reduces goalkeeper anticipation by 120–150 ms. Body feinting: 35% of elite penalty attempts include a body feint, increasing conversion rate 8–12%.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">35% risk ↓</div>
                    <div className="hb-finding-ref">Achenbach 2017</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Progressive Warm-Up Protocol</div>
                    <div className="hb-finding-desc">Structured pre-training warm-up throwing protocol (progressive: 30 throws at 50%, 30 at 70%, 20 at 85%, 20 at full intensity) reduces in-session shoulder injury risk 35%. Season-long throwing workload monitoring: &gt;300 high-intensity throws/week correlates with 3× increased rotator cuff injury risk.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Goalkeeper Science */}
            <div className="hb-card yellow-red">
              <div className="hb-card-glow-orb" />
              <div className="hb-card-num">03</div>
              <div className="hb-card-top-row">
                <div className="hb-card-icon">🧤</div>
                <div className="hb-card-kicker">Goalkeeper Science</div>
              </div>
              <div className="hb-card-title">Goalkeeper Science &amp; Reaction</div>
              <div className="hb-card-findings">
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">150–250 ms</div>
                    <div className="hb-finding-ref">Schorer 2007</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">First Movement Initiation</div>
                    <div className="hb-finding-desc">Ball-in-flight time from 7m: 350–400 ms at competition speed. Goalkeeper first movement initiation: 150–250 ms — meaning goalkeepers cannot react to the ball alone and must anticipate from pre-release cues. Experts read 5–8 kinematic cues collectively. Novice goalkeepers rely on ball tracking post-release — providing 50–100 ms less effective reaction time.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">65% leg saves</div>
                    <div className="hb-finding-ref">Hatzimanouil 2017</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Save Type Distribution</div>
                    <div className="hb-finding-desc">EHF Championships analysis: upper body blocks 35%; leg and foot saves 40%; diving saves 25%. Diving save lateral reach: 2.2–2.8 m (total goalkeeper reach across goal). Corner shots 22–28% save rate; central body-height shots 45–55%.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">150–200</div>
                    <div className="hb-finding-ref">Santos 2019</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Explosive Jumps per Session</div>
                    <div className="hb-finding-desc">Handball goalkeeper training includes 150–200 explosive jump actions per session. Vertical jump: elite goalkeepers average 42–52 cm CMJ. Lateral movement speed: fastest side-shuffle from post to post (3m): &lt;0.8 s for elite. Plyometric programme improves save rate 8–12% over 8-week intervention.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">3 fixation pts</div>
                    <div className="hb-finding-ref">Savelsbergh 2005</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Expert Gaze Behaviour</div>
                    <div className="hb-finding-desc">Expert handball goalkeepers distribute visual attention across 3 simultaneous fixation areas — shooter&apos;s shoulder, hip, and ball — vs. novice goalkeepers who use single sequential fixation. Multi-fixation strategy provides 80–100 ms earlier movement initiation. Visual training using video simulation improves save rate 10–18%.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Training & Tactics */}
            <div className="hb-card red-yellow">
              <div className="hb-card-glow-orb" />
              <div className="hb-card-num">04</div>
              <div className="hb-card-top-row">
                <div className="hb-card-icon">📊</div>
                <div className="hb-card-kicker">Periodisation &amp; Tactics</div>
              </div>
              <div className="hb-card-title">Training Periodisation &amp; Team Tactics</div>
              <div className="hb-card-findings">
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">5–6 sessions</div>
                    <div className="hb-finding-ref">Michalsik 2015</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Elite Weekly Training Volume</div>
                    <div className="hb-finding-desc">Professional handball clubs average 5–6 training sessions per week of 90–120 min each, plus 1–2 competitive matches. Season structure: 25–35 matches over 9-month season. Weekly PlayerLoad targets: mid-season 60–75% of pre-season peak.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">3-sec window</div>
                    <div className="hb-finding-ref">Taborsky 2011</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Fast Break Timing</div>
                    <div className="hb-finding-desc">IHF technical analysis: handball fast breaks develop within 3 seconds of ball possession change. Successful fast breaks convert at 78–85% vs. organised defence conversion of 38–45%. 28% of elite level goals scored in transition — making transition conditioning the highest-ROI tactical investment.</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">+18% scoring</div>
                    <div className="hb-finding-ref">Foretić 2013</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">7v6 Attacking Advantage</div>
                    <div className="hb-finding-desc">Pulling the goalkeeper for a 7th field player increases offensive scoring probability by 18%. Risk: immediate counter-attack if ball lost. Modern tactical trend: 7v6 used 15–25% of attacking possessions in top European leagues (Bundesliga, SEHA).</div>
                  </div>
                </div>
                <div className="hb-finding">
                  <div className="hb-finding-stat">
                    <div className="hb-finding-stat-val">+4–8% velocity</div>
                    <div className="hb-finding-ref">Gorostiaga 1999</div>
                  </div>
                  <div className="hb-finding-body">
                    <div className="hb-finding-title">Creatine &amp; Throwing Performance</div>
                    <div className="hb-finding-desc">4-week creatine monohydrate supplementation (20g/day loading × 5 days, then 5g/day) increased handball throwing velocity 4–8% and repeated sprint performance. Creatine&apos;s PCr-restoring role is relevant in handball where 25–40 sub-maximal and maximal throws per match demand repeated explosive shoulder output.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Disclaimer */}
          <div className="hb-disclaimer">
            <div className="hb-disclaimer-text">
              DISCLAIMER: All statistics and findings are drawn from peer-reviewed sports science literature and authoritative sporting bodies including the EHF and IHF. Research citations are approximate and for educational reference only. Performance data reflects elite competition conditions and may not be applicable to recreational or developing players. KQuarks health tracking data is synced from Apple Health and represents your personal activity — not population benchmarks. Consult qualified coaching and medical professionals for individual training and injury management decisions.
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
