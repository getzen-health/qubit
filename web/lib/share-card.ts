export type ShareCardData = {
  type: 'streak' | 'workout' | 'milestone' | 'weekly_summary' | 'achievement'
  title: string
  subtitle?: string
  metric?: string
  metricLabel?: string
  secondaryMetric?: string
  secondaryLabel?: string
  emoji?: string
  date?: string
  username?: string
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080)
  const colors: Record<ShareCardData['type'], [string, string]> = {
    streak: ['#FF6B35', '#F7931E'],
    workout: ['#4158D0', '#C850C0'],
    milestone: ['#0093E9', '#80D0C7'],
    weekly_summary: ['#8EC5FC', '#E0C3FC'],
    achievement: ['#FDDB92', '#D1FDFF'],
  }
  const [c1, c2] = colors[data.type]
  gradient.addColorStop(0, c1)
  gradient.addColorStop(1, c2)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1080)

  // Semi-transparent overlay for readability
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(0, 0, 1080, 1080)

  // App logo / name
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 36px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('⚡ KQuarks', 80, 80)

  // Main emoji
  const emoji = data.emoji ?? '🏆'
  ctx.font = '160px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(emoji, 540, 380)

  // Main metric (big number)
  if (data.metric) {
    ctx.fillStyle = 'white'
    ctx.font = 'bold 140px -apple-system, system-ui, sans-serif'
    ctx.fillText(data.metric, 540, 560)
    if (data.metricLabel) {
      ctx.font = '48px -apple-system, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(data.metricLabel, 540, 620)
    }
  }

  // Title
  ctx.fillStyle = 'white'
  ctx.font = 'bold 72px -apple-system, system-ui, sans-serif'
  ctx.fillText(data.title, 540, 720)

  // Subtitle
  if (data.subtitle) {
    ctx.font = '44px -apple-system, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(data.subtitle, 540, 790)
  }

  // Secondary metric
  if (data.secondaryMetric && data.secondaryLabel) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '36px -apple-system, system-ui, sans-serif'
    ctx.fillText(`${data.secondaryMetric} ${data.secondaryLabel}`, 540, 850)
  }

  // Username & date bottom
  ctx.font = '32px -apple-system, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.textAlign = 'left'
  if (data.username) ctx.fillText(`@${data.username}`, 80, 1020)
  if (data.date) {
    ctx.textAlign = 'right'
    ctx.fillText(data.date, 1000, 1020)
  }

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95))
}

export function downloadCard(blob: Blob, filename = 'kquarks-share.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareCard(blob: Blob, title: string, text: string) {
  if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'health.png', { type: 'image/png' })] })) {
    await navigator.share({
      title,
      text,
      files: [new File([blob], 'health.png', { type: 'image/png' })],
    })
    return true
  }
  return false
}
