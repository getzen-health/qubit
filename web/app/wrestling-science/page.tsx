import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Wrestling Science' }

export default function WrestlingSciencePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Russo+One&family=Teko:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Barlow+Condensed:wght@400;500;600;700;800;900&display=swap');

        :root {
          --mat-black: #0e0c0b;
          --mat-dark: #141210;
          --mat-surface: #1a1714;
          --mat-surface-2: #201d1a;
          --mat-border: #2a2520;
          --crimson: #c8102e;
          --crimson-bright: #e8192f;
          --crimson-dim: #8b0b20;
          --crimson-glow: rgba(200, 16, 46, 0.15);
          --indigo: #2e1f6e;
          --indigo-bright: #4a35a8;
          --indigo-mid: #3d2a8a;
          --indigo-glow: rgba(74, 53, 168, 0.15);
          --chalk: #e8e0d4;
          --chalk-dim: #9a9088;
          --chalk-faint: #3d3830;
          --gold: #c9943a;
          --gold-dim: #7a5a1e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ws-root {
          min-height: 100vh;
          background-color: var(--mat-black);
          color: var(--chalk);
          font-family: 'Barlow Condensed', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Grain noise overlay */
        .ws-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* Mat circle geometry */
        .ws-root::after {
          content: '';
          position: fixed;
          top: -30vh;
          right: -20vw;
          width: 80vw;
          height: 80vw;
          border-radius: 50%;
          border: 1px solid var(--chalk-faint);
          pointer-events: none;
          z-index: 0;
          opacity: 0.3;
        }

        /* Header */
        .ws-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(14, 12, 11, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--mat-border);
        }

        .ws-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ws-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 4px;
          background: var(--mat-surface);
          border: 1px solid var(--mat-border);
          color: var(--chalk-dim);
          text-decoration: none;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .ws-back-btn:hover {
          background: var(--mat-surface-2);
          border-color: var(--chalk-faint);
          color: var(--chalk);
        }

        .ws-header-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--crimson);
        }

        .ws-header-title {
          font-family: 'Russo One', sans-serif;
          font-size: 18px;
          letter-spacing: 0.05em;
          color: var(--chalk);
          text-transform: uppercase;
        }

        /* Main */
        .ws-main {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        /* Hero */
        .ws-hero {
          position: relative;
          padding: 80px 0 60px;
          overflow: hidden;
        }

        .ws-hero-bg-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 700px;
          border-radius: 50%;
          border: 1px solid var(--chalk-faint);
          pointer-events: none;
          opacity: 0.25;
        }

        .ws-hero-bg-circle-2 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 1px solid var(--chalk-faint);
          pointer-events: none;
          opacity: 0.15;
        }

        .ws-hero-diagonal {
          position: absolute;
          top: 0;
          left: -10%;
          width: 120%;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--crimson), transparent);
          transform: rotate(-2deg);
          opacity: 0.6;
        }

        .ws-hero-diagonal-2 {
          position: absolute;
          bottom: 20px;
          left: -10%;
          width: 120%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--indigo-bright), transparent);
          transform: rotate(-2deg);
          opacity: 0.4;
        }

        .ws-hero-tag {
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

        .ws-hero-tag::before {
          content: '';
          display: block;
          width: 40px;
          height: 2px;
          background: var(--crimson);
        }

        .ws-hero-h1 {
          font-family: 'Russo One', sans-serif;
          font-size: clamp(52px, 9vw, 110px);
          line-height: 0.9;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 8px;
        }

        .ws-hero-h1 span.accent {
          color: var(--crimson-bright);
          display: block;
        }

        .ws-hero-h1 span.indigo {
          color: var(--indigo-bright);
          -webkit-text-stroke: 1px var(--indigo-bright);
          color: transparent;
        }

        .ws-hero-sub {
          font-family: 'Teko', sans-serif;
          font-size: clamp(18px, 3vw, 28px);
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-top: 20px;
          max-width: 600px;
          line-height: 1.3;
        }

        .ws-hero-stats {
          display: flex;
          gap: 32px;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .ws-hero-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ws-hero-stat-num {
          font-family: 'Russo One', sans-serif;
          font-size: 36px;
          color: var(--chalk);
          line-height: 1;
        }

        .ws-hero-stat-num .unit {
          font-size: 16px;
          color: var(--crimson);
          vertical-align: top;
          margin-top: 4px;
          display: inline-block;
        }

        .ws-hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--chalk-dim);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ws-hero-stat-divider {
          width: 1px;
          background: var(--chalk-faint);
          align-self: stretch;
          margin: 4px 0;
        }

        /* Pulse animation */
        @keyframes pulse-crimson {
          0%, 100% { opacity: 1; transform: scaleX(1); }
          50% { opacity: 0.6; transform: scaleX(0.97); }
        }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes heartbeat {
          0%, 100% { transform: scaleY(1); }
          10% { transform: scaleY(2.2); }
          20% { transform: scaleY(0.8); }
          30% { transform: scaleY(1.8); }
          40% { transform: scaleY(1); }
        }

        .ws-hero {
          animation: fade-up 0.6s ease both;
        }

        /* Section title */
        .ws-section-title {
          font-family: 'Teko', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 8px;
        }

        .ws-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--mat-border);
        }

        /* Science cards grid */
        .ws-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          gap: 2px;
          margin-bottom: 2px;
        }

        @media (max-width: 640px) {
          .ws-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Science card */
        .ws-card {
          background: var(--mat-surface);
          border: 1px solid var(--mat-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s ease;
          animation: fade-up 0.5s ease both;
        }

        .ws-card:hover {
          border-color: var(--chalk-faint);
        }

        .ws-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .ws-card.crimson::before { background: var(--crimson); }
        .ws-card.indigo::before { background: var(--indigo-bright); }
        .ws-card.gold::before { background: var(--gold); }
        .ws-card.teal::before { background: #1a7a6e; }

        .ws-card-accent-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }

        .ws-card.crimson .ws-card-accent-bg { background: var(--crimson-glow); }
        .ws-card.indigo .ws-card-accent-bg { background: var(--indigo-glow); }
        .ws-card.gold .ws-card-accent-bg { background: rgba(201, 148, 58, 0.08); }
        .ws-card.teal .ws-card-accent-bg { background: rgba(26, 122, 110, 0.08); }

        .ws-card-num {
          font-family: 'Russo One', sans-serif;
          font-size: 72px;
          line-height: 1;
          position: absolute;
          top: 24px;
          right: 28px;
          opacity: 0.07;
          letter-spacing: -0.05em;
        }

        .ws-card-icon-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ws-card-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .ws-card.crimson .ws-card-icon { background: var(--crimson-glow); }
        .ws-card.indigo .ws-card-icon { background: var(--indigo-glow); }
        .ws-card.gold .ws-card-icon { background: rgba(201, 148, 58, 0.1); }
        .ws-card.teal .ws-card-icon { background: rgba(26, 122, 110, 0.1); }

        .ws-card-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--chalk-dim);
        }

        .ws-card.crimson .ws-card-kicker { color: var(--crimson); }
        .ws-card.indigo .ws-card-kicker { color: var(--indigo-bright); }
        .ws-card.gold .ws-card-kicker { color: var(--gold); }
        .ws-card.teal .ws-card-kicker { color: #2bbfa8; }

        .ws-card-title {
          font-family: 'Teko', sans-serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--chalk);
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .ws-card-findings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ws-finding {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.025);
          border-left: 2px solid var(--mat-border);
          transition: border-color 0.15s ease;
        }

        .ws-finding:hover {
          background: rgba(255,255,255,0.04);
        }

        .ws-card.crimson .ws-finding:hover { border-left-color: var(--crimson-dim); }
        .ws-card.indigo .ws-finding:hover { border-left-color: var(--indigo-mid); }
        .ws-card.gold .ws-finding:hover { border-left-color: var(--gold-dim); }
        .ws-card.teal .ws-finding:hover { border-left-color: #1a7a6e; }

        .ws-finding-stat {
          flex-shrink: 0;
          min-width: 90px;
        }

        .ws-finding-stat-val {
          font-family: 'Russo One', sans-serif;
          font-size: 20px;
          color: var(--chalk);
          line-height: 1;
          white-space: nowrap;
        }

        .ws-card.crimson .ws-finding-stat-val { color: var(--crimson-bright); }
        .ws-card.indigo .ws-finding-stat-val { color: var(--indigo-bright); }
        .ws-card.gold .ws-finding-stat-val { color: var(--gold); }
        .ws-card.teal .ws-finding-stat-val { color: #2bbfa8; }

        .ws-finding-stat-ref {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          margin-top: 2px;
          letter-spacing: 0.05em;
        }

        .ws-finding-body {
          flex: 1;
        }

        .ws-finding-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 2px;
        }

        .ws-finding-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--chalk-dim);
          line-height: 1.45;
        }

        /* Weight classes */
        .ws-weight-section {
          margin-top: 48px;
          animation: fade-up 0.5s ease 0.1s both;
        }

        .ws-weight-classes {
          background: var(--mat-surface);
          border: 1px solid var(--mat-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .ws-weight-classes::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, var(--crimson), var(--indigo-bright));
          opacity: 0.4;
        }

        .ws-weight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }

        .ws-weight-class {
          padding: 12px 8px;
          background: var(--mat-surface-2);
          border: 1px solid var(--mat-border);
          text-align: center;
          transition: all 0.15s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .ws-weight-class::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--crimson);
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }

        .ws-weight-class:hover::before {
          transform: scaleX(1);
        }

        .ws-weight-class:hover {
          border-color: var(--chalk-faint);
          background: rgba(255,255,255,0.04);
        }

        .ws-weight-kg {
          font-family: 'Russo One', sans-serif;
          font-size: 22px;
          color: var(--chalk);
          line-height: 1;
        }

        .ws-weight-lbs {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          margin-top: 3px;
          letter-spacing: 0.05em;
        }

        .ws-weight-name {
          font-family: 'Teko', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--crimson);
          margin-top: 4px;
        }

        /* Energy Timeline */
        .ws-timeline-section {
          margin-top: 48px;
          animation: fade-up 0.5s ease 0.15s both;
        }

        .ws-timeline-card {
          background: var(--mat-surface);
          border: 1px solid var(--mat-border);
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .ws-timeline-intro {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--chalk-dim);
          margin-bottom: 28px;
          max-width: 700px;
          line-height: 1.5;
        }

        .ws-timeline {
          position: relative;
          padding: 8px 0;
        }

        /* Period bar row */
        .ws-period-bar-row {
          display: flex;
          align-items: stretch;
          margin-bottom: 28px;
          gap: 0;
          height: 48px;
          border: 1px solid var(--mat-border);
          overflow: hidden;
        }

        .ws-period-seg {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-right: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .ws-period-seg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.05);
          opacity: 0;
          transition: opacity 0.15s;
        }

        .ws-period-seg:hover::after {
          opacity: 1;
        }

        .ws-period-seg:last-child { border-right: none; }

        .ws-period-label {
          font-weight: 600;
          font-size: 10px;
          color: var(--chalk);
          line-height: 1;
        }

        .ws-period-sub {
          font-size: 8px;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
        }

        /* Period: Burst */
        .ws-period-burst {
          background: linear-gradient(135deg, rgba(200,16,46,0.35), rgba(200,16,46,0.15));
          flex: 1;
        }

        /* Period: High */
        .ws-period-high {
          background: linear-gradient(135deg, rgba(200,16,46,0.2), rgba(200,16,46,0.08));
          flex: 2;
        }

        /* Period: Sustained */
        .ws-period-sustained {
          background: linear-gradient(135deg, rgba(74,53,168,0.2), rgba(74,53,168,0.08));
          flex: 3;
        }

        /* Period: Recovery */
        .ws-period-recovery {
          background: linear-gradient(135deg, rgba(74,53,168,0.1), rgba(74,53,168,0.04));
          flex: 1;
        }

        /* HR line visualization */
        .ws-hr-graph {
          position: relative;
          height: 90px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--mat-border);
          padding-bottom: 8px;
        }

        .ws-hr-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: var(--chalk-dim);
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .ws-hr-svg {
          width: 100%;
          height: 70px;
          overflow: visible;
        }

        @keyframes draw-line {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }

        .ws-hr-path {
          fill: none;
          stroke: var(--crimson-bright);
          stroke-width: 2;
          stroke-dasharray: 1000;
          stroke-dashoffset: 0;
          animation: draw-line 2s ease 0.3s both;
        }

        .ws-hr-fill {
          fill: url(#hrGradient);
          opacity: 0.2;
        }

        /* Systems legend */
        .ws-systems {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 600px) {
          .ws-systems { grid-template-columns: 1fr; }
        }

        .ws-system-item {
          padding: 14px;
          background: var(--mat-surface-2);
          border: 1px solid var(--mat-border);
        }

        .ws-system-bar-wrap {
          height: 6px;
          background: var(--mat-border);
          border-radius: 1px;
          margin-bottom: 10px;
          overflow: hidden;
        }

        .ws-system-bar {
          height: 100%;
          border-radius: 1px;
          transition: width 1s ease;
        }

        .ws-system-bar.pcr { background: var(--crimson-bright); width: 70%; }
        .ws-system-bar.glycolytic { background: var(--indigo-bright); width: 25%; }
        .ws-system-bar.oxidative { background: var(--gold); width: 5%; }

        /* After a short delay, show animated bars */
        @keyframes grow-bar {
          from { width: 0; }
        }

        .ws-system-bar { animation: grow-bar 1s ease 0.5s both; }

        .ws-system-name {
          font-family: 'Teko', sans-serif;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--chalk);
          margin-bottom: 2px;
        }

        .ws-system-pct {
          font-family: 'Russo One', sans-serif;
          font-size: 24px;
          color: var(--chalk-dim);
          line-height: 1;
        }

        .ws-system-pct.crimson-text { color: var(--crimson-bright); }
        .ws-system-pct.indigo-text { color: var(--indigo-bright); }
        .ws-system-pct.gold-text { color: var(--gold); }

        .ws-system-desc {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          color: var(--chalk-dim);
          margin-top: 4px;
          line-height: 1.4;
        }

        /* Diagonal divider */
        .ws-diagonal-divider {
          width: 100%;
          height: 48px;
          position: relative;
          margin: 40px 0;
          overflow: hidden;
        }

        .ws-diagonal-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--chalk-faint) 20%, var(--chalk-faint) 80%, transparent);
          transform: rotate(-1deg);
        }

        .ws-diagonal-divider-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--mat-black);
          padding: 4px 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--chalk-dim);
          white-space: nowrap;
        }

        /* Heartbeat bars (decorative) */
        .ws-heartbeat-viz {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 32px;
          margin: 24px 0;
        }

        .ws-hb-bar {
          width: 4px;
          background: var(--crimson);
          border-radius: 1px 1px 0 0;
          opacity: 0.6;
          animation: heartbeat 1.5s ease infinite;
        }

        .ws-hb-bar:nth-child(1) { height: 20%; animation-delay: 0s; }
        .ws-hb-bar:nth-child(2) { height: 15%; animation-delay: 0.05s; }
        .ws-hb-bar:nth-child(3) { height: 80%; animation-delay: 0.1s; opacity: 1; }
        .ws-hb-bar:nth-child(4) { height: 20%; animation-delay: 0.15s; }
        .ws-hb-bar:nth-child(5) { height: 100%; animation-delay: 0.05s; opacity: 1; }
        .ws-hb-bar:nth-child(6) { height: 30%; animation-delay: 0.1s; }
        .ws-hb-bar:nth-child(7) { height: 20%; animation-delay: 0.15s; }
        .ws-hb-bar:nth-child(8) { height: 15%; animation-delay: 0.2s; }
        .ws-hb-bar:nth-child(9) { height: 70%; animation-delay: 0.1s; opacity: 0.9; }
        .ws-hb-bar:nth-child(10) { height: 20%; animation-delay: 0.15s; }
        .ws-hb-bar:nth-child(11) { height: 90%; animation-delay: 0.05s; opacity: 1; }
        .ws-hb-bar:nth-child(12) { height: 25%; animation-delay: 0.1s; }
        .ws-hb-bar:nth-child(13) { height: 15%; animation-delay: 0.15s; }
        .ws-hb-bar:nth-child(14) { height: 20%; animation-delay: 0s; }
        .ws-hb-bar:nth-child(15) { height: 60%; animation-delay: 0.05s; opacity: 0.8; }
        .ws-hb-bar:nth-child(16) { height: 20%; animation-delay: 0.1s; }

        /* Info/disclaimer */
        .ws-disclaimer {
          margin-top: 48px;
          padding: 20px 24px;
          background: var(--mat-surface);
          border: 1px solid var(--mat-border);
          border-left: 3px solid var(--chalk-faint);
        }

        .ws-disclaimer-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--chalk-dim);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }

        /* Card stagger animations */
        .ws-card:nth-child(1) { animation-delay: 0.0s; }
        .ws-card:nth-child(2) { animation-delay: 0.07s; }
        .ws-card:nth-child(3) { animation-delay: 0.14s; }
        .ws-card:nth-child(4) { animation-delay: 0.21s; }

        /* Hover glow on cards */
        .ws-card.crimson:hover { box-shadow: inset 0 0 60px var(--crimson-glow); }
        .ws-card.indigo:hover { box-shadow: inset 0 0 60px var(--indigo-glow); }
        .ws-card.gold:hover { box-shadow: inset 0 0 60px rgba(201,148,58,0.08); }
        .ws-card.teal:hover { box-shadow: inset 0 0 60px rgba(26,122,110,0.08); }

        /* Responsive */
        @media (max-width: 768px) {
          .ws-hero-h1 { font-size: 52px; }
          .ws-hero-stats { gap: 20px; }
          .ws-weight-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
          .ws-card { padding: 24px 20px; }
          .ws-weight-classes { padding: 24px 20px; }
          .ws-timeline-card { padding: 24px 20px; }
        }
      `}} />

      <div className="ws-root">
        {/* Header */}
        <header className="ws-header">
          <div className="ws-header-inner">
            <Link href="/workouts" className="ws-back-btn" aria-label="Back">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="ws-header-label">Sports Science Series</div>
              <div className="ws-header-title">Wrestling Science</div>
            </div>
          </div>
        </header>

        <main className="ws-main">
          {/* Hero */}
          <section className="ws-hero">
            <div className="ws-hero-bg-circle" />
            <div className="ws-hero-bg-circle-2" />
            <div className="ws-hero-diagonal" />
            <div className="ws-hero-diagonal-2" />

            <div className="ws-hero-tag">High-Intensity Anaerobic Combat Sport</div>

            <h1 className="ws-hero-h1">
              <span>WRESTLING</span>
              <span className="accent">PHYSI</span>
              <span className="indigo">OLOGY</span>
            </h1>

            <p className="ws-hero-sub">
              The biomechanics of force, fatigue, and survival on the mat. Evidence-based performance science.
            </p>

            {/* Heartbeat viz */}
            <div className="ws-heartbeat-viz">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(i => (
                <div key={i} className="ws-hb-bar" />
              ))}
            </div>

            <div className="ws-hero-stats">
              <div className="ws-hero-stat">
                <div className="ws-hero-stat-num">
                  175–190<span className="unit">bpm</span>
                </div>
                <div className="ws-hero-stat-label">Match Heart Rate</div>
              </div>
              <div className="ws-hero-stat-divider" />
              <div className="ws-hero-stat">
                <div className="ws-hero-stat-num">
                  65–70<span className="unit">%</span>
                </div>
                <div className="ws-hero-stat-label">Anaerobic Energy</div>
              </div>
              <div className="ws-hero-stat-divider" />
              <div className="ws-hero-stat">
                <div className="ws-hero-stat-num">
                  2.5–3.5<span className="unit">×BW</span>
                </div>
                <div className="ws-hero-stat-label">Takedown Force</div>
              </div>
              <div className="ws-hero-stat-divider" />
              <div className="ws-hero-stat">
                <div className="ws-hero-stat-num">
                  8–14<span className="unit">mmol</span>
                </div>
                <div className="ws-hero-stat-label">Blood Lactate</div>
              </div>
            </div>
          </section>

          {/* Science Cards */}
          <div className="ws-section-title">Research Findings</div>

          <div className="ws-cards-grid">
            {/* Card 1: Match Physiology */}
            <div className="ws-card crimson">
              <div className="ws-card-accent-bg" />
              <div className="ws-card-num">01</div>
              <div className="ws-card-icon-row">
                <div className="ws-card-icon">⚡</div>
                <div className="ws-card-kicker">Match Physiology</div>
              </div>
              <div className="ws-card-title">Energy Systems &amp; Cardiac Demand</div>
              <div className="ws-card-findings">
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">175–190</div>
                    <div className="ws-finding-stat-ref">bpm — Yoon 2002</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Sustained Match HR</div>
                    <div className="ws-finding-desc">Heart rate remains elevated throughout the entire bout, rarely dropping during scrambles. Near-maximal cardiac output is maintained for 6–7 minutes.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">8–14</div>
                    <div className="ws-finding-stat-ref">mmol/L — Yoon 2002</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Blood Lactate Peak</div>
                    <div className="ws-finding-desc">Post-match lactate concentrations confirm intense anaerobic glycolysis. Values correlate with match intensity and wrestling level.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">65–70<span style={{fontSize:'12px'}}>%</span></div>
                    <div className="ws-finding-stat-ref">anaerobic — Horswill 1992</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Anaerobic Contribution</div>
                    <div className="ws-finding-desc">Wrestling is predominantly anaerobic. Phosphocreatine and glycolytic pathways dominate, especially during explosive takedown attempts.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">80–95<span style={{fontSize:'12px'}}>%</span></div>
                    <div className="ws-finding-stat-ref">MVC — Ratamess 2011</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Grip Strength Demand</div>
                    <div className="ws-finding-desc">Grip forces reach 80–95% of maximal voluntary contraction during clinch work. Forearm fatigue is a key performance limiter in late rounds.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">PCr</div>
                    <div className="ws-finding-stat-ref">recovery — Vardar 2007</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Phosphocreatine Recovery</div>
                    <div className="ws-finding-desc">Between-period rest allows partial PCr resynthesis. Athletes with superior aerobic capacity recover faster, enabling repeated explosive bursts.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Biomechanics */}
            <div className="ws-card indigo">
              <div className="ws-card-accent-bg" />
              <div className="ws-card-num">02</div>
              <div className="ws-card-icon-row">
                <div className="ws-card-icon">⚙️</div>
                <div className="ws-card-kicker">Biomechanics</div>
              </div>
              <div className="ws-card-title">Takedown Mechanics &amp; Force Analysis</div>
              <div className="ws-card-findings">
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">2.5–3.5×</div>
                    <div className="ws-finding-stat-ref">BW — Funk 2004</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Double-Leg Ground Reaction</div>
                    <div className="ws-finding-desc">Ground reaction forces during double-leg takedown penetration steps reach 2.5–3.5× body weight. Ankle and knee joints absorb massive loading.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">0.15–0.25</div>
                    <div className="ws-finding-stat-ref">sec — Elko 2013</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Level Change Time</div>
                    <div className="ws-finding-desc">Elite wrestlers execute the level change (lowering center of mass to penetrate) in 150–250ms. Reaction time is the primary determinant of takedown success.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Sprawl</div>
                    <div className="ws-finding-stat-ref">defense — Onate 2006</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Sprawl Defense Mechanics</div>
                    <div className="ws-finding-desc">Effective sprawl requires hip extension power and rapid posterior weight shift. Hip-to-shoulder distance and timing are the critical kinematic variables for stuffing shots.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Pin</div>
                    <div className="ws-finding-stat-ref">mechanics — Utter 2002</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Pinning Force Distribution</div>
                    <div className="ws-finding-desc">Successful pins rely on crossbody pressure vectors exceeding opponent's bridge force. Upper-body strength and hip control are the primary determinants.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Weight Cutting */}
            <div className="ws-card gold">
              <div className="ws-card-accent-bg" />
              <div className="ws-card-num">03</div>
              <div className="ws-card-icon-row">
                <div className="ws-card-icon">⚖️</div>
                <div className="ws-card-kicker">Weight Management</div>
              </div>
              <div className="ws-card-title">Cutting Science &amp; Dehydration</div>
              <div className="ws-card-findings">
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">−9.5<span style={{fontSize:'12px'}}>%</span></div>
                    <div className="ws-finding-stat-ref">power — Fogelholm 1994</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Anaerobic Power Loss</div>
                    <div className="ws-finding-desc">5% body weight dehydration produces a 9.5% decrease in anaerobic power output. Even at 3% dehydration, significant performance decrements are measurable.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Cycling</div>
                    <div className="ws-finding-stat-ref">harm — Oppliger 1998</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Rapid Weight Cycling Risk</div>
                    <div className="ws-finding-desc">Repeated rapid weight cutting causes cumulative physiological harm: suppressed testosterone, elevated cortisol, reduced bone density, and impaired immune function.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">24h</div>
                    <div className="ws-finding-stat-ref">rehydration — Barr 1999</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Recovery Insufficient</div>
                    <div className="ws-finding-desc">24 hours is insufficient to fully restore plasma volume, glycogen stores, and muscle function after large-magnitude weight cuts. Weigh-in timing is a critical policy variable.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Safer</div>
                    <div className="ws-finding-stat-ref">strategies — Timpmann 2008</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Safer Cutting Protocols</div>
                    <div className="ws-finding-desc">Gradual weight reduction over 4–6 weeks with preserved protein intake and carbohydrate periodization minimizes performance loss while achieving target weight.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Injury Prevention */}
            <div className="ws-card teal">
              <div className="ws-card-accent-bg" />
              <div className="ws-card-num">04</div>
              <div className="ws-card-icon-row">
                <div className="ws-card-icon">🛡️</div>
                <div className="ws-card-kicker">Injury Prevention</div>
              </div>
              <div className="ws-card-title">Injury Patterns &amp; Risk Mitigation</div>
              <div className="ws-card-findings">
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">28<span style={{fontSize:'12px'}}>%</span></div>
                    <div className="ws-finding-stat-ref">knee — Wroble 1996</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Knee Injury Prevalence</div>
                    <div className="ws-finding-desc">Knee injuries account for 28% of wrestling injuries. Medial collateral ligament sprains dominate, occurring during takedown attempts and defensive scrambles.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">21<span style={{fontSize:'12px'}}>%</span></div>
                    <div className="ws-finding-stat-ref">shoulder — Wroble 1996</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Shoulder Injury Rate</div>
                    <div className="ws-finding-desc">Shoulder injuries (21% of total) include AC joint sprains and rotator cuff strains. Most occur during defensive sprawling or when posting on an extended arm.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Ear</div>
                    <div className="ws-finding-stat-ref">trauma — Schuller 1989</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Cauliflower Ear</div>
                    <div className="ws-finding-desc">Repeated auricular hematomas from mat friction and clinch pressure cause perichondrium separation and cartilage necrosis. Headgear compliance reduces incidence by ~73%.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">Skin</div>
                    <div className="ws-finding-stat-ref">infection — Adams 2002</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Dermatological Infections</div>
                    <div className="ws-finding-desc">Herpes gladiatorum, ringworm, and MRSA are prevalent. Mat hygiene protocols, skin checks, and exclusion policies are primary prevention strategies.</div>
                  </div>
                </div>
                <div className="ws-finding">
                  <div className="ws-finding-stat">
                    <div className="ws-finding-stat-val">C-spine</div>
                    <div className="ws-finding-stat-ref">risk — Pasque 2000</div>
                  </div>
                  <div className="ws-finding-body">
                    <div className="ws-finding-title">Cervical Spine Risk</div>
                    <div className="ws-finding-desc">Axial loading during double-leg defense and thrown takedowns creates cervical spine risk. Strengthening neck musculature and teaching safe falling technique are key interventions.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagonal divider */}
          <div className="ws-diagonal-divider">
            <div className="ws-diagonal-divider-text">Weight Classes — NCAA &amp; UWW</div>
          </div>

          {/* Weight Classes */}
          <section className="ws-weight-section">
            <div className="ws-weight-classes">
              <div style={{marginBottom: '20px'}}>
                <div className="ws-section-title" style={{marginBottom: '4px'}}>Competition Weight Classes</div>
                <div style={{fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', color: 'var(--chalk-dim)', fontWeight: 500}}>
                  Weight management science applies across all divisions. The smaller the class gap, the greater the cutting risk.
                </div>
              </div>
              <div className="ws-weight-grid">
                {[
                  {kg: '57', lbs: '125.7 lb', name: 'Flyweight'},
                  {kg: '65', lbs: '143.3 lb', name: 'Lightweight'},
                  {kg: '74', lbs: '163.1 lb', name: 'Welterweight'},
                  {kg: '86', lbs: '189.6 lb', name: 'Middleweight'},
                  {kg: '97', lbs: '213.8 lb', name: 'Light Heavy'},
                  {kg: '109', lbs: '240.3 lb', name: 'Heavyweight'},
                  {kg: '125+', lbs: '275+ lb', name: 'Super Heavy'},
                ].map(cls => (
                  <div key={cls.kg} className="ws-weight-class">
                    <div className="ws-weight-kg">{cls.kg}</div>
                    <div className="ws-weight-lbs">{cls.lbs}</div>
                    <div className="ws-weight-name">{cls.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Energy Timeline */}
          <section className="ws-timeline-section">
            <div className="ws-section-title">Energy System Timeline</div>
            <div className="ws-timeline-card">
              <div className="ws-timeline-intro">
                During a 6-minute wrestling match, all three energy systems contribute, but the ratio shifts dramatically as PCr stores deplete and lactate accumulates. Aerobic capacity determines recovery rate between bursts.
              </div>

              {/* HR Graph */}
              <div className="ws-hr-graph">
                <div className="ws-hr-label">Heart Rate Approximation — 6-min Match</div>
                <svg className="ws-hr-svg" viewBox="0 0 600 70" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8102e" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#c8102e" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Fill area */}
                  <path
                    className="ws-hr-fill"
                    d="M 0 65 L 20 60 L 40 45 L 60 30 L 80 22 L 100 18 L 140 14 L 180 12 L 200 10 L 220 15 L 240 10 L 260 8 L 280 11 L 300 13 L 320 10 L 340 8 L 360 12 L 380 10 L 400 14 L 420 10 L 440 8 L 460 12 L 480 10 L 500 11 L 520 10 L 540 9 L 560 11 L 580 10 L 600 8 L 600 70 Z"
                  />
                  {/* HR line */}
                  <path
                    className="ws-hr-path"
                    d="M 0 65 L 20 60 L 40 45 L 60 30 L 80 22 L 100 18 L 140 14 L 180 12 L 200 10 L 220 15 L 240 10 L 260 8 L 280 11 L 300 13 L 320 10 L 340 8 L 360 12 L 380 10 L 400 14 L 420 10 L 440 8 L 460 12 L 480 10 L 500 11 L 520 10 L 540 9 L 560 11 L 580 10 L 600 8"
                    strokeDasharray="1200"
                  />
                  {/* Labels */}
                  <text x="5" y="68" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">0:00</text>
                  <text x="190" y="68" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">2:00</text>
                  <text x="390" y="68" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">4:00</text>
                  <text x="575" y="68" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">6:00</text>
                  {/* HR scale */}
                  <text x="4" y="10" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">190bpm</text>
                  <text x="4" y="38" fill="#9a9088" fontSize="7" fontFamily="IBM Plex Mono">175bpm</text>
                  <line x1="55" y1="0" x2="55" y2="62" stroke="#2a2520" strokeWidth="0.5" strokeDasharray="3 3"/>
                </svg>
              </div>

              {/* Period bar */}
              <div style={{marginBottom: '8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--chalk-dim)', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
                Match Phases — Energy System Dominance
              </div>
              <div className="ws-period-bar-row">
                <div className="ws-period-seg ws-period-burst" style={{flex: 1}}>
                  <div className="ws-period-label">BURST</div>
                  <div className="ws-period-sub">0–30s · PCr</div>
                </div>
                <div className="ws-period-seg ws-period-high" style={{flex: 1.5}}>
                  <div className="ws-period-label">HIGH-INT</div>
                  <div className="ws-period-sub">30s–2m · Glycolytic</div>
                </div>
                <div className="ws-period-seg ws-period-sustained" style={{flex: 2}}>
                  <div className="ws-period-label">SUSTAINED</div>
                  <div className="ws-period-sub">2m–5m · Mixed</div>
                </div>
                <div className="ws-period-seg ws-period-recovery" style={{flex: 0.8}}>
                  <div className="ws-period-label">FINAL</div>
                  <div className="ws-period-sub">5m–6m · Fatigue</div>
                </div>
              </div>

              {/* Energy systems */}
              <div className="ws-systems" style={{marginTop: '24px'}}>
                <div className="ws-system-item">
                  <div className="ws-system-bar-wrap">
                    <div className="ws-system-bar pcr" />
                  </div>
                  <div className="ws-system-name">Phosphocreatine</div>
                  <div className="ws-system-pct crimson-text">~65–70%</div>
                  <div className="ws-system-desc">Immediate explosive energy for shots, scrambles, and lifts. Depletes within 10–15s of maximal effort.</div>
                </div>
                <div className="ws-system-item">
                  <div className="ws-system-bar-wrap">
                    <div className="ws-system-bar glycolytic" />
                  </div>
                  <div className="ws-system-name">Glycolytic</div>
                  <div className="ws-system-pct indigo-text">~25–30%</div>
                  <div className="ws-system-desc">Sustains intensity after PCr depletion. Produces lactate accumulation responsible for muscular burn and fatigue.</div>
                </div>
                <div className="ws-system-item">
                  <div className="ws-system-bar-wrap">
                    <div className="ws-system-bar oxidative" />
                  </div>
                  <div className="ws-system-name">Oxidative</div>
                  <div className="ws-system-pct gold-text">~5%</div>
                  <div className="ws-system-desc">Aerobic capacity primarily governs recovery rate between bouts, not match output directly. Critical for tournament performance.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="ws-disclaimer">
            <div className="ws-disclaimer-text">
              All statistics cited from peer-reviewed sports science literature. Sources: Yoon (2002) J Strength Cond Res · Horswill (1992) Med Sci Sports Exerc · Ratamess (2011) J Strength Cond Res · Vardar (2007) J Sports Med Phys Fitness · Funk (2004) Am J Sports Med · Elko (2013) J Sports Biomech · Onate (2006) J Athletic Training · Utter (2002) J Strength Cond Res · Fogelholm (1994) Int J Sports Med · Oppliger (1998) Med Sci Sports Exerc · Barr (1999) J Athletic Training · Timpmann (2008) J Sports Sci · Wroble (1996) Am J Sports Med · Schuller (1989) Am J Sports Med · Adams (2002) Clin Dermatol · Pasque (2000) Am J Sports Med
            </div>
          </div>

        </main>
      </div>
    </>
  )
}
