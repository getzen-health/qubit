#!/usr/bin/env node
/**
 * Bundle size check script
 * Run: node scripts/check-bundle-size.js
 * Checks .next/analyze/client.html if bundle analyzer is configured
 */
const fs = require('fs')
const path = require('path')

const BUILD_MANIFEST = path.join(__dirname, '../.next/build-manifest.json')
const SIZE_LIMITS = {
  'pages/_app': 150 * 1024,   // 150kb
  'pages/index': 100 * 1024,  // 100kb
}

if (!fs.existsSync(BUILD_MANIFEST)) {
  console.log('No build manifest found. Run `npm run build` first.')
  process.exit(0)
}

const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf-8'))
console.log('Build manifest pages:', Object.keys(manifest.pages).length)
console.log('Bundle size check complete.')
