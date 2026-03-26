// To enable: ANALYZE=true npm run build
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config
module.exports = withBundleAnalyzer
